# SPDX-License-Identifier: BSD-3-Clause
# Copyright (c) 2026 SciCat Project (https://github.com/SciCatProject/scitacean)

import pathlib
from scitacean import Client, ScicatCommError
import anywidget
from ._scicat_api import get_user_and_scicat_info
from typing import Any
from ._logging import get_logger
import traitlets

_STATIC_PATH = pathlib.Path(__file__).parent / "_static"


class DatasetUploadWidget(anywidget.AnyWidget):
    _esm = _STATIC_PATH / "datasetUploadWidget.js"
    _css = _STATIC_PATH / "datasetUploadWidget.css"

    initial = traitlets.Dict().tag(sync=True)


def dataset_upload_widget(client: Client | None = None) -> DatasetUploadWidget:
    initial = _collect_initial_data(client)
    widget = DatasetUploadWidget(initial=initial)
    return widget


def _collect_initial_data(client: Client | None = None) -> dict[str, Any]:
    if client is None:
        return {}
    return _download_initial_data(client)


def _download_initial_data(client: Client) -> dict[str, Any]:
    try:
        user_info, instruments = get_user_and_scicat_info(client)
    except (ScicatCommError, ValueError, TypeError) as error:
        get_logger().warning("Failed to download initial data for user: %s", error)
        return {}

    return {
        "owners": [
            {
                "name": user_info.display_name,
                "email": user_info.email,
                "orcid": user_info.orcid_id,
            },
        ],
    }
