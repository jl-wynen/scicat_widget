# SPDX-License-Identifier: BSD-3-Clause
# Copyright (c) 2026 SciCat Project (https://github.com/SciCatProject/scitacean)

import inspect
import pathlib
from collections.abc import Callable, Iterable
from typing import Any

import anywidget
import ipywidgets
import traitlets
from scitacean import Client, Dataset, ScicatCommError

from ._comm import handle_event
from ._logging import get_logger
from ._model import Config, Instrument, ProposalOverview
from ._scicat_api import get_user_and_scicat_info
from ._serialization import (
    load_and_serialize_techniques,
    serialize_dataset,
    serialize_instrument,
    serialize_proposal,
)

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
        )
        self.client = client  # TODO create client here if not given

        # This `Output` is displayed alongside `self` so that sub widgets,
        # e.g., a file picker can be attached to it and displayed.
        # We need this because we cannot display widgets in callbacks
        # as those don't have a display context.
        self._aux_output_widget = ipywidgets.Output()
        self._aux_output_widget.add_class("cean-output-anchor")
        self._is_displaying = False

        self.on_msg(handle_event)

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


def _collect_initial_data(
        client: Client | None = None, initial: Dataset | None = None
) -> tuple[dict[str, Any], dict[str, Any]]:
    if client is None:
        return {}, {}
    initial_data, instruments, proposals, access_groups = _download_scicat_data(client)

    static_data = {
        "instruments": [serialize_instrument(instrument) for instrument in instruments],
        "proposals": [serialize_proposal(proposal) for proposal in proposals],
        "accessGroups": access_groups,
        "techniques": load_and_serialize_techniques(),
    }

    if initial is not None:
        initial_data.update(serialize_dataset(initial))

    return initial_data, static_data


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
