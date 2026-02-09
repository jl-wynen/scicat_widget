# SPDX-License-Identifier: BSD-3-Clause
# Copyright (c) 2026 SciCat Project (https://github.com/SciCatProject/scitacean)

import os
import pathlib
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus, urljoin

import anywidget
import IPython.display
import ipywidgets
import traitlets
from jupyter_host_file_picker import HostFilePicker
from scitacean import Client, Dataset, File, ScicatCommError, Thumbnail
from scitacean.ontology import expands_techniques

from ._logging import get_logger
from ._model import Instrument, ProposalOverview
from ._scicat_api import get_user_and_scicat_info
from ._upload import UploadError, upload_dataset

_STATIC_PATH = pathlib.Path(__file__).parent / "_static"


class DatasetUploadWidget(anywidget.AnyWidget):
    _esm = _STATIC_PATH / "datasetUploadWidget.js"
    _css = _STATIC_PATH / "datasetUploadWidget.css"

    initial = traitlets.Dict().tag(sync=True)
    instruments = traitlets.List(trait=traitlets.Any()).tag(sync=True)
    proposals = traitlets.List(trait=traitlets.Any()).tag(sync=True)
    accessGroups = traitlets.List(trait=traitlets.Unicode()).tag(sync=True)
    techniques = traitlets.Dict(trait=traitlets.Any()).tag(sync=True)
    scicatUrl = traitlets.Unicode().tag(sync=True)
    skipConfirm = traitlets.Bool().tag(sync=True)

    def __init__(self, client: Client, /, *, skip_confirm: bool = False) -> None:
        initial, instruments, proposals, access_groups = _collect_initial_data(client)
        super().__init__(
            initial=initial,
            instruments=[
                _serialize_instrument(instrument) for instrument in instruments
            ],
            proposals=[_serialize_proposal(proposal) for proposal in proposals],
            accessGroups=access_groups,
            techniques=_load_techniques(),
            scicatUrl="https://staging.scicat.ess.eu/",  # TODO detect from client
            skipConfirm=skip_confirm,
            client=client,  # type: ignore[arg-type]  # TODO create client here if not given
        )
        self.client = client

        # This `Output` is displayed alongside `self` so that sub widgets,
        # e.g., a file picker can be attached to it and displayed.
        # We need this because we cannot display widgets in callbacks
        # as those don't have a display context.
        self._aux_output_widget = ipywidgets.Output()
        self._aux_output_widget.add_class("cean-output-anchor")
        self._is_displaying = False

        self.on_msg(_handle_event)

    def _repr_mimebundle_(
        self, **kwargs: Any
    ) -> tuple[dict[Any, Any], dict[Any, Any]] | None:
        # This is a bit hacky, but it allows us to display this DatasetUploadWidget like
        # normal while also placing the aux output widget next to it.
        if self._is_displaying:
            return super()._repr_mimebundle_(**kwargs)
        self._is_displaying = True
        try:
            return ipywidgets.VBox([self, self._aux_output_widget])._repr_mimebundle_(  # type: ignore[no-any-return]
                **kwargs
            )
        finally:
            self._is_displaying = False


def _collect_initial_data(
    client: Client | None = None,
) -> tuple[dict[str, Any], list[Instrument], list[ProposalOverview], list[str]]:
    if client is None:
        return {}, [], [], []
    data, instruments, proposals, access_groups = _download_scicat_data(client)
    return data, instruments, proposals, access_groups


def _download_scicat_data(
    client: Client,
) -> tuple[dict[str, Any], list[Instrument], list[ProposalOverview], list[str]]:
    try:
        user_info, instruments = get_user_and_scicat_info(client)
    except (ScicatCommError, ValueError, TypeError, RuntimeError) as error:
        get_logger().warning("Failed to download initial data for user: %s", error)
        return {}, [], [], []

    proposals = user_info.proposals
    access_groups = user_info.access_groups

    initial_data = {
        "owners": [
            {
                "name": user_info.display_name,
                "email": user_info.email,
                "orcid": user_info.orcid_id,
            },
        ],
    }
    return initial_data, instruments, proposals, access_groups


def _serialize_instrument(instrument: Instrument) -> dict[str, Any]:
    return {
        "id": instrument.pid,
        "name": instrument.name,
        "uniqueName": instrument.unique_name,
    }


def _serialize_proposal(proposal: ProposalOverview) -> dict[str, Any]:
    return {
        "id": proposal.id_,
        "title": proposal.title,
        "instrumentIds": proposal.instrument_ids,
        "piName": proposal.pi_name,
        "piEmail": proposal.pi_email,
    }


def _load_techniques() -> dict[str, Any]:
    prefix = next(iter(expands_techniques().keys())).rsplit("/", 1)[0]
    return {
        "prefix": prefix,
        "techniques": [
            {"id": id_.rsplit("/", 1)[-1], "name": names[0]}
            for (id_, names) in expands_techniques().items()
        ],
    }


def _inspect_file(
    widget: DatasetUploadWidget, key: str, input_payload: dict[str, str]
) -> None:
    try:
        # TODO do not allow folders (probably in scitacean)
        file = File.from_local(input_payload["filename"])
        payload = {
            "success": True,
            "size": file.size,
            "creationTime": file.creation_time,
            "remotePath": file.remote_path.posix,
        }
    except FileNotFoundError:
        payload = {"success": False, "error": "File not found"}
    widget.send(
        {
            "type": "res:inspect-file",
            "key": key,
            "payload": {
                # Echo the input to identify the element that the request came from.
                **input_payload,
                **payload,
            },
        }
    )


def _browse_files(
    widget: DatasetUploadWidget, key: str, _input_payload: dict[str, str]
) -> None:
    def send_selected_files(change: dict[str, Any]) -> None:
        selected: list[Path] = change["new"]
        # TODO handle multi select once supported by file picker
        if len(change) > 0:
            widget.send(
                {
                    "type": "res:browse-files",
                    "key": key,
                    "payload": {
                        "selected": os.fspath(selected[0]),
                    },
                }
            )

    # Use the output widget's context manager to capture the display call
    with widget._aux_output_widget:
        widget._aux_output_widget.clear_output()  # clear previous picker if any
        picker = HostFilePicker()
        picker.observe(send_selected_files, names="selected")
        IPython.display.display(picker)  # type: ignore[no-untyped-call]


def _load_image(
    widget: DatasetUploadWidget, key: str, input_payload: dict[str, str]
) -> None:
    path = Path(input_payload.get("path", ""))
    try:
        thumbnail = Thumbnail.load_file(path)
    except FileNotFoundError:
        payload = {"error": "File not found"}
    else:
        payload = {"image": thumbnail.serialize(), "caption": path.stem}

    widget.send(
        {
            "type": "res:load-image",
            "key": key,
            "payload": payload,
        }
    )


def _upload_dataset(
    widget: DatasetUploadWidget, key: str, payload: dict[str, object]
) -> None:
    match upload_dataset(widget.client, payload):
        case Dataset() as ds:
            widget.send(
                {
                    "type": "res:upload-dataset",
                    "key": key,
                    "payload": {
                        "datasetName": ds.name,
                        "pid": str(ds.pid),
                        "datasetUrl": urljoin(
                            widget.scicatUrl, "datasets/" + quote_plus(str(ds.pid))
                        ),
                    },
                }
            )
        case UploadError() as error:
            widget.send(
                {
                    "type": "res:upload-dataset",
                    "key": key,
                    "payload": error.model_dump(),
                }
            )


_EVENT_HANDLERS = {
    "req:inspect-file": _inspect_file,
    "req:browse-files": _browse_files,
    "req:load-image": _load_image,
    "req:upload-dataset": _upload_dataset,
}


def _handle_event(
    widget: DatasetUploadWidget, content: dict[str, Any], buffer: object
) -> None:
    try:
        handler = _EVENT_HANDLERS[content["type"]]
    except KeyError:
        get_logger().warning("Received unknown event from widget: %s", content)
        return
    handler(widget, content["key"], content["payload"])  # type: ignore[operator]
