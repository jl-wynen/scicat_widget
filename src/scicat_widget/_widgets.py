# SPDX-License-Identifier: BSD-3-Clause
# Copyright (c) 2026 SciCat Project (https://github.com/SciCatProject/scitacean)

import pathlib
from typing import Any

import anywidget
import traitlets
from scitacean import Client, File, ScicatCommError
from scitacean.ontology import expands_techniques

from ._logging import get_logger
from ._model import Instrument, ProposalOverview
from ._scicat_api import get_user_and_scicat_info
from ._upload import upload_dataset

_STATIC_PATH = pathlib.Path(__file__).parent / "_static"


class DatasetUploadWidget(anywidget.AnyWidget):
    _esm = _STATIC_PATH / "datasetUploadWidget.js"
    _css = _STATIC_PATH / "datasetUploadWidget.css"

    initial = traitlets.Dict().tag(sync=True)
    instruments = traitlets.List().tag(sync=True)
    proposals = traitlets.List().tag(sync=True)
    accessGroups = traitlets.List().tag(sync=True)
    techniques = traitlets.Dict().tag(sync=True)
    scicatUrl = traitlets.Unicode().tag(sync=True)
    skipConfirm = traitlets.Bool().tag(sync=True)

    def __init__(self, *, client: Client, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.client = client


def dataset_upload_widget(
    client: Client | None = None, *, skip_confirm: bool = False
) -> DatasetUploadWidget:
    initial, instruments, proposals, access_groups = _collect_initial_data(client)
    widget = DatasetUploadWidget(
        initial=initial,
        instruments=[_serialize_instrument(instrument) for instrument in instruments],
        proposals=[_serialize_proposal(proposal) for proposal in proposals],
        accessGroups=access_groups,
        techniques=_load_techniques(),
        scicatUrl="https://staging.scicat.ess.eu/",  # TODO detector from client
        skipConfirm=skip_confirm,
        client=client,
    )
    widget.on_msg(_handle_event)
    return widget


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
    except (ScicatCommError, ValueError, TypeError) as error:
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


def _inspect_file(widget: DatasetUploadWidget, input_payload: dict[str, str]) -> None:
    try:
        # TODO do not allow folders (probably in scitacean)
        file = File.from_local(input_payload["filename"])
        payload = {
            "success": True,
            "size": file.size,
            "creationTime": file.creation_time,
        }
    except FileNotFoundError:
        payload = {"success": False, "error": "File not found"}
    widget.send(
        {
            "type": "res:inspect-file",
            "payload": {
                # Echo the input to identify the element that the request came from.
                **input_payload,
                **payload,
            },
        }
    )


def _upload_dataset(widget: DatasetUploadWidget, payload: dict[str, object]) -> None:
    print("Uploading")
    print("raw payload:", payload)
    dataset = upload_dataset(widget.client, payload)


_EVENT_HANDLERS = {
    "req:inspect-file": _inspect_file,
    "cmd:upload-dataset": _upload_dataset,
}


def _handle_event(
    widget: DatasetUploadWidget, content: dict[str, object], buffer: object
) -> None:
    try:
        handler = _EVENT_HANDLERS[content["type"]]  # type: ignore[arg-type]
    except KeyError:
        get_logger().warning("Received unknown event from widget: %s", content)
        return
    handler(widget, content["payload"])
