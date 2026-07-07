# SPDX-License-Identifier: BSD-3-Clause
# Copyright (c) 2026 SciCat Project (https://github.com/SciCatProject/scitacean)

import inspect
import os
import pathlib
import warnings
from collections.abc import Callable, Iterable
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus, urljoin

import anywidget
import IPython.display
import ipywidgets
import traitlets
from jupyter_host_file_picker import HostFilePicker
from scitacean import Attachment, Client, Dataset, File, ScicatCommError, Thumbnail
from scitacean.ontology import expands_techniques

from ._filesystem import inspect_file
from ._logging import get_logger
from ._model import Config, Instrument, ProposalOverview
from ._scicat_api import get_user_and_scicat_info
from ._upload import UploadError, upload_dataset

_STATIC_PATH = pathlib.Path(__file__).parent / "_static"


class DatasetUploadWidget(anywidget.AnyWidget):
    _esm = _STATIC_PATH / "datasetUploadWidget.js"
    _css = _STATIC_PATH / "datasetUploadWidget.css"

    config = traitlets.Dict().tag(sync=True)
    initial = traitlets.Dict().tag(sync=True)
    staticData = traitlets.Dict().tag(sync=True)

    def __init__(
        self,
        client: Client,
        /,
        *,
        initial: Dataset | None = None,
        locked: Iterable[str] = (),
        skip_confirm: bool = False,
    ) -> None:
        config = _build_config(client, locked=locked, skip_confirm=skip_confirm)
        initial_data, static = _collect_initial_data(client, initial)
        super().__init__(
            config=config.model_dump(),
            initial=initial_data,
            staticData=static,
            client=client,  # TODO create client here if not given
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


def _build_config(
    client: Client,
    *,
    locked: Iterable[str],
    skip_confirm: bool,
) -> Config:
    profile = client.profile
    return Config(
        frontendUrl=profile.frontend_url,
        scientificMetadataSchema=profile.scientific_metadata_schema,
        fieldDependencies={
            name: _extract_factory_dependencies(fn)
            for name, fn in profile.field_factories.items()
        },
        lockedFields=list(locked),
        skipConfirmation=skip_confirm,
    )


def _extract_factory_dependencies(factory: Callable[..., object]) -> list[str]:
    spec = inspect.getfullargspec(factory)
    if spec.varargs is not None or spec.varkw is not None:
        raise TypeError("Variable arguments are not supported")
    return [*spec.args, *spec.kwonlyargs]


def _call_field_factory(factory: Callable[..., Any], args: dict[str, Any]) -> Any:
    spec = inspect.getfullargspec(factory)
    pos_args = [args[name] for name in spec.args]
    kw_args = {name: args[name] for name in spec.kwonlyargs}
    return factory(*pos_args, **kw_args)


def _collect_initial_data(
    client: Client | None = None, initial: Dataset | None = None
) -> tuple[dict[str, Any], dict[str, Any]]:
    if client is None:
        return {}, {}
    initial_data, instruments, proposals, access_groups = _download_scicat_data(client)

    static_data = {
        "instruments": [
            _serialize_instrument(instrument) for instrument in instruments
        ],
        "proposals": [_serialize_proposal(proposal) for proposal in proposals],
        "accessGroups": access_groups,
        "techniques": _load_techniques(),
    }

    if initial is not None:
        initial_data.update(_serialize_dataset(initial))

    return initial_data, static_data


def _serialize_dataset(dataset: Dataset) -> dict[str, Any]:
    # TODO reverse in upload
    set = {
        key: val for key, val in dataset.make_upload_fields().items() if val is not None
    }
    if "techniques" in set:
        # TODO reverse in upload
        set["techniques"] = [t.pid.rsplit("/", 1)[-1] for t in set["techniques"]]
    if "sourceFolder" in set:
        set["sourceFolder"] = set["sourceFolder"].posix
    if "contactEmail" in set:
        set["contactEmails"] = set.pop("contactEmail").split(";")
    if "inputDatasets" in set:
        set["inputDatasets"] = [str(pid) for pid in set["inputDatasets"]]

    set = _listify_owners(set)

    set["files"] = [
        set_file
        for file in dataset.files
        if (set_file := _serialize_file(file)) is not None
    ]

    set["attachments"] = [
        set_att
        for attachment in dataset.attachments or []
        if (set_att := _serialize_attachment(attachment)) is not None
    ]
    return set


def _serialize_file(file: File) -> dict[str, str | int | datetime] | None:
    if file.local_path is None:
        return None
    for name in ("remote_gid", "remote_perm", "remote_uid"):
        if value := getattr(file, name):
            warnings.warn(
                f"file.{name} will be dropped in upload; input has value '{value}'",
                UserWarning,
                stacklevel=2,
            )
    result = inspect_file(file.local_path)
    if not result:
        return None
    result.pop("success", None)
    return {
        **result,
        "localPath": os.fspath(file.local_path),
        "remotePath": file.remote_path.posix,
    }


def _serialize_attachment(attachment: Attachment) -> dict[str, str] | None:
    if (thumbnail := attachment.thumbnail) is None:
        return None
    return {"data": thumbnail.serialize(), "caption": attachment.caption}


def _listify_owners(data: dict[str, Any]) -> dict[str, Any]:
    data = dict(data)

    names = _split_list_string(data.pop("owner", ""))
    emails = _split_list_string(data.pop("ownerEmail", ""))
    orcids = _split_list_string(data.pop("orcidOfOwner", ""))

    if not names and not emails and not orcids:
        return data

    lengths = {l for l in (len(names), len(emails), len(orcids)) if l > 0}
    if len(lengths) != 1:
        raise ValueError(
            "Need an equal number of entries in 'owner', 'owner_email', and "
            f"'orcid_of_owner'. Got {len(names)}, {len(emails)}, and {len(orcids)}"
        )
    n = next(iter(lengths))
    names = names or [""] * n
    emails = emails or [""] * n
    orcids = orcids or [""] * n

    data["owners"] = [
        {"name": name or None, "email": email or None, "orcid": orcid or None}
        for name, email, orcid in zip(names, emails, orcids, strict=False)
    ]

    return data


def _split_list_string(string: str) -> list[str]:
    string = string.strip()
    if not string:
        return []  # the code below would return [''] in this case
    # Keep empty strings to get a proper number of elements.
    return [s.strip() for s in string.split(";")]


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
        "startTime": proposal.start_time,
        "instrumentIds": proposal.instrument_ids,
        "piName": proposal.pi_name,
        "piEmail": proposal.pi_email,
        "type": proposal.type,
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
    payload = inspect_file(Path(input_payload["filename"])) or {
        "success": False,
        "error": "File not found",
        **input_payload,
    }
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


def _build_field(
    widget: DatasetUploadWidget, key: str, input_payload: dict[str, Any]
) -> None:
    try:
        factory = widget.client.profile.field_factories[input_payload["name"]]
    except KeyError:
        payload = {"error": f"No factory for field {input_payload['name']}"}
    else:
        payload = {"value": _call_field_factory(factory, input_payload["values"])}

    widget.send(
        {
            "type": "res:build-field",
            "key": key,
            "payload": payload,
        }
    )


def _load_image(
    widget: DatasetUploadWidget, key: str, input_payload: dict[str, str]
) -> None:
    path = Path(input_payload.get("path", ""))
    try:
        thumbnail = Thumbnail.load_file(path)
    except FileNotFoundError:
        payload = {"error": "File not found"}
    else:
        payload = {
            "image": thumbnail.serialize(),
            "caption": input_payload.get("caption", path.stem),
        }

    widget.send(
        {
            "type": "res:load-image",
            "key": key,
            # Echo the input to identify the element that the request came from.
            "payload": {**payload, **input_payload},
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
                            widget.config["frontendUrl"],
                            "datasets/" + quote_plus(str(ds.pid)),
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
    "req:browse-files": _browse_files,
    "req:build-field": _build_field,
    "req:inspect-file": _inspect_file,
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
