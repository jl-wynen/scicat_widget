# SPDX-License-Identifier: BSD-3-Clause
# Copyright (c) 2026 SciCat Project (https://github.com/SciCatProject/scitacean)

import pathlib
from typing import Any

import anywidget
import traitlets
from scitacean import Client, ScicatCommError

from ._logging import get_logger
from ._model import Instrument
from ._scicat_api import get_user_and_scicat_info

_STATIC_PATH = pathlib.Path(__file__).parent / "_static"


class DatasetUploadWidget(anywidget.AnyWidget):
    _esm = _STATIC_PATH / "datasetUploadWidget.js"
    _css = _STATIC_PATH / "datasetUploadWidget.css"

    initial = traitlets.Dict().tag(sync=True)
    instruments = traitlets.List().tag(sync=True)


def dataset_upload_widget(client: Client | None = None) -> DatasetUploadWidget:
    initial, instruments = _collect_initial_data(client)
    widget = DatasetUploadWidget(
        initial=initial,
        instruments=[_serialize_instrument(instrument) for instrument in instruments],
    )
    return widget


def _collect_initial_data(
    client: Client | None = None,
) -> tuple[dict[str, Any], list[Instrument]]:
    if client is None:
        return {}, []
    data, instruments = _download_scicat_data(client)
    return data, instruments


def _download_scicat_data(
    client: Client,
) -> tuple[dict[str, Any], list[Instrument]]:
    try:
        user_info, instruments = get_user_and_scicat_info(client)
    except (ScicatCommError, ValueError, TypeError) as error:
        get_logger().warning("Failed to download initial data for user: %s", error)
        return {}, []

    initial_data = {
        "owners": [
            {
                "name": user_info.display_name,
                "email": user_info.email,
                "orcid": user_info.orcid_id,
            },
        ],
    }
    return initial_data, instruments


def _serialize_instrument(instrument: Instrument) -> dict[str, Any]:
    return {
        "id": instrument.pid,
        "name": instrument.name,
        "uniqueName": instrument.unique_name,
    }
