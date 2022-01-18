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

import "./service-details.scss";

import React from "react";
import { disposeOnUnmount, observer } from "mobx-react";
import { DrawerItem, DrawerTitle } from "../drawer";
import { Badge } from "../badge";
import type { KubeObjectDetailsProps } from "../kube-object-details";
import { Service } from "../../../common/k8s-api/endpoints";
import { KubeObjectMeta } from "../kube-object-meta";
import { ServicePortComponent } from "./service-port-component";
import { endpointStore } from "../+network-endpoints/endpoints.store";
import { ServiceDetailsEndpoint } from "./service-details-endpoint";
import type { PortForwardStore } from "../../port-forward";
import logger from "../../../common/logger";
import type { KubeObjectStore } from "../../../common/k8s-api/kube-object.store";
import type { KubeObject } from "../../../common/k8s-api/kube-object";
import type { Disposer } from "../../../common/utils";
import { withInjectables } from "@ogre-tools/injectable-react";
import kubeWatchApiInjectable
  from "../../kube-watch-api/kube-watch-api.injectable";
import portForwardStoreInjectable from "../../port-forward/port-forward-store/port-forward-store.injectable";
import type { KubeWatchSubscribeStoreOptions } from "../../kube-watch-api/kube-watch-api";

interface Props extends KubeObjectDetailsProps<Service> {
}

interface Dependencies {
  subscribeStores: (stores: KubeObjectStore<KubeObject>[], options: KubeWatchSubscribeStoreOptions) => Disposer
  portForwardStore: PortForwardStore
}

@observer
class NonInjectedServiceDetails extends React.Component<Props & Dependencies> {
  componentDidMount() {
    const { object: service } = this.props;

    disposeOnUnmount(this, [
      this.props.subscribeStores([
        endpointStore,
      ], {
        namespaces: [service.getNs()],
      }),
      this.props.portForwardStore.watch(),
    ]);
  }

  render() {
    const { object: service } = this.props;

    if (!service) {
      return null;
    }

    if (!(service instanceof Service)) {
      logger.error("[ServiceDetails]: passed object that is not an instanceof Service", service);

      return null;
    }

    const { spec } = service;
    const endpoint = endpointStore.getByName(service.getName(), service.getNs());
    const externalIps = service.getExternalIps();

    if (externalIps.length === 0 && spec?.externalName) {
      externalIps.push(spec.externalName);
    }

    return (
      <div className="ServicesDetails">
        <KubeObjectMeta object={service}/>

        <DrawerItem name="Selector" labelsOnly>
          {service.getSelector().map(selector => <Badge key={selector} label={selector}/>)}
        </DrawerItem>

        <DrawerItem name="Type">
          {spec.type}
        </DrawerItem>

        <DrawerItem name="Session Affinity">
          {spec.sessionAffinity}
        </DrawerItem>

        <DrawerTitle title="Connection"/>

        <DrawerItem name="Cluster IP">
          {spec.clusterIP}
        </DrawerItem>

        <DrawerItem name="Cluster IPs" hidden={!service.getClusterIps().length} labelsOnly>
          {
            service.getClusterIps().map(label => (
              <Badge key={label} label={label}/>
            ))
          }
        </DrawerItem>

        <DrawerItem name="IP families" hidden={!service.getIpFamilies().length}>
          {service.getIpFamilies().join(", ")}
        </DrawerItem>

        <DrawerItem name="IP family policy" hidden={!service.getIpFamilyPolicy()}>
          {service.getIpFamilyPolicy()}
        </DrawerItem>

        {externalIps.length > 0 && (
          <DrawerItem name="External IPs">
            {externalIps.map(ip => <div key={ip}>{ip}</div>)}
          </DrawerItem>
        )}

        <DrawerItem name="Ports">
          <div>
            {
              service.getPorts().map((port) => (
                <ServicePortComponent service={service} port={port} key={port.toString()}/>
              ))
            }
          </div>
        </DrawerItem>

        {spec.type === "LoadBalancer" && spec.loadBalancerIP && (
          <DrawerItem name="Load Balancer IP">
            {spec.loadBalancerIP}
          </DrawerItem>
        )}
        <DrawerTitle title="Endpoint"/>

        <ServiceDetailsEndpoint endpoint={endpoint}/>
      </div>
    );
  }
}

export const ServiceDetails = withInjectables<Dependencies, Props>(
  NonInjectedServiceDetails,

  {
    getProps: (di, props) => ({
      subscribeStores: di.inject(kubeWatchApiInjectable).subscribeStores,
      portForwardStore: di.inject(portForwardStoreInjectable),
      ...props,
    }),
  },
);