/**
 * Copyright (c) 2021 OpenLens Authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import React from "react";
import { observer } from "mobx-react";
import { Select } from "../select";
import hotbarManagerInjectable from "../../../common/hotbar-store.injectable";
import type { CommandOverlay } from "../command-palette";
import { HotbarAddCommand } from "./hotbar-add-command";
import { HotbarRemoveCommand } from "./hotbar-remove-command";
import { HotbarRenameCommand } from "./hotbar-rename-command";
import type { Hotbar } from "../../../common/hotbar-types";
import { withInjectables } from "@ogre-tools/injectable-react";
import commandOverlayInjectable from "../command-palette/command-overlay.injectable";

const addActionId = "__add__";
const removeActionId = "__remove__";
const renameActionId = "__rename__";

interface HotbarManager {
  hotbars: Hotbar[];
  setActiveHotbar: (id: string) => void;
  getDisplayLabel: (hotbar: Hotbar) => string;
}

interface Dependencies {
  hotbarManager: HotbarManager
  commandOverlay: CommandOverlay;
}

function getHotbarSwitchOptions(hotbarManager: HotbarManager) {
  const options = hotbarManager.hotbars.map(hotbar => ({
    value: hotbar.id,
    label: hotbarManager.getDisplayLabel(hotbar),
  }));

  options.push({ value: addActionId, label: "Add hotbar ..." });

  if (hotbarManager.hotbars.length > 1) {
    options.push({ value: removeActionId, label: "Remove hotbar ..." });
  }

  options.push({ value: renameActionId, label: "Rename hotbar ..." });

  return options;
}

const NonInjectedHotbarSwitchCommand = observer(({ hotbarManager, commandOverlay }: Dependencies) => {
  const options = getHotbarSwitchOptions(hotbarManager);

  const onChange = (idOrAction: string): void  => {
    switch (idOrAction) {
      case addActionId:
        return commandOverlay.open(<HotbarAddCommand />);
      case removeActionId:
        return commandOverlay.open(<HotbarRemoveCommand />);
      case renameActionId:
        return commandOverlay.open(<HotbarRenameCommand />);
      default:
        hotbarManager.setActiveHotbar(idOrAction);
        commandOverlay.close();
    }
  };

  return (
    <Select
      menuPortalTarget={null}
      onChange={(v) => onChange(v.value)}
      components={{ DropdownIndicator: null, IndicatorSeparator: null }}
      menuIsOpen={true}
      options={options}
      autoFocus={true}
      escapeClearsValue={false}
      placeholder="Switch to hotbar"
    />
  );
});

export const HotbarSwitchCommand = withInjectables<Dependencies>(NonInjectedHotbarSwitchCommand, {
  getProps: (di, props) => ({
    hotbarManager: di.inject(hotbarManagerInjectable),
    commandOverlay: di.inject(commandOverlayInjectable),
    ...props,
  }),
});