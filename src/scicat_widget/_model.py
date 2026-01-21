# SPDX-License-Identifier: BSD-3-Clause
# Copyright (c) 2026 SciCat Project (https://github.com/SciCatProject/scitacean)

from pydantic import BaseModel, EmailStr
from scitacean.model import Instrument


class ProposalOverview(BaseModel):
    id_: str
    title: str
    instrument_ids: list[str]


class UserInfo(BaseModel):
    user_id: str
    display_name: str | None
    email: EmailStr | None
    access_groups: list[str]
    orcid_id: str | None
    # The proposals we know the user is a member of, they may have access to more:
    proposals: list[ProposalOverview]


__all__ = ["Instrument", "ProposalOverview", "UserInfo"]
