# SPDX-License-Identifier: BSD-3-Clause
# Copyright (c) 2026 SciCat Project (https://github.com/SciCatProject/scitacean)

import pathlib
from typing import Any

import anywidget
import traitlets
from scitacean import Client, ScicatCommError

from ._logging import get_logger
from ._model import Instrument, ProposalOverview
from ._scicat_api import get_user_and_scicat_info

_STATIC_PATH = pathlib.Path(__file__).parent / "_static"


class DatasetUploadWidget(anywidget.AnyWidget):
    _esm = _STATIC_PATH / "datasetUploadWidget.js"
    _css = _STATIC_PATH / "datasetUploadWidget.css"

    initial = traitlets.Dict().tag(sync=True)
    instruments = traitlets.List().tag(sync=True)
    proposals = traitlets.List().tag(sync=True)
    accessGroups = traitlets.List().tag(sync=True)


def dataset_upload_widget(client: Client | None = None) -> DatasetUploadWidget:
    initial, instruments, proposals, access_groups = _collect_initial_data(client)
    widget = DatasetUploadWidget(
        initial=initial,
        instruments=[_serialize_instrument(instrument) for instrument in instruments],
        proposals=[_serialize_proposal(proposal) for proposal in proposals],
        accessGroups=access_groups,
    )
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
