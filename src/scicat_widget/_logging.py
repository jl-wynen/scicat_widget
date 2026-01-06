# SPDX-License-Identifier: BSD-3-Clause
# Copyright (c) 2026 SciCat Project (https://github.com/SciCatProject/scitacean)

import logging


# TODO does not show up in Jupyter (need to configure handler)
def get_logger() -> logging.Logger:
    return logging.getLogger("scicat-widget")
