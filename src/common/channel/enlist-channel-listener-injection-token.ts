/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectionToken } from "@ogre-tools/injectable";
import type { Channel } from "./channel-injection-token";

export type EnlistChannelListener = <TChannel extends Channel<unknown>>(
  channel: TChannel,
  handler: (value: TChannel["_messageTemplate"]) => void
) => () => void;

export const enlistChannelListenerInjectionToken =
  getInjectionToken<EnlistChannelListener>({
    id: "enlist-channel-listener",
  });
