// Dependencies
import { Widget } from "@lumino/widgets";
import React, { Ref } from "react";
import * as ReactDOM from "react-dom";

// Project Components
import ErrorBoundary from "./components/ErrorBoundary";
import MainMenu from "./components/menus/NEW_MainMenu";
import AboutPopup, { IAboutRef } from "./components/modals/NEW_AboutPopup";
import { TestProvider, IProviderRef } from "./modules/TestProvider";

/**
 * This is the main component for the vcdat extension.
 */
export default class VCDATWidget extends Widget {
  public div: HTMLDivElement; // The div container for this widget
  public showAbout: () => void;
  public toggleTopButtons: () => void;
  public version: string;

  constructor(rootID: string) {
    super();
    this.div = document.createElement("div");
    this.div.id = rootID;
    this.node.appendChild(this.div);
    this.id = "main-widget-vcdat";
    this.title.iconClass = "jp-SideBar-tabIcon jp-icon-vcdat";
    this.title.closable = true;
    this.version = "Baconator";
    const aboutPopupRef: Ref<IAboutRef> = React.createRef();
    const testProviderRef: Ref<IProviderRef> = React.createRef();

    ReactDOM.render(
      <ErrorBoundary>
        <TestProvider ref={testProviderRef}>
          <MainMenu />
          <AboutPopup version={this.version} ref={aboutPopupRef} />
        </TestProvider>
      </ErrorBoundary>,
      this.div
    );

    this.showAbout = (): void => {
      aboutPopupRef.current.show();
    };

    this.toggleTopButtons = (): void => {
      const state = testProviderRef.current.state;
      const dispatch = testProviderRef.current.dispatch;
      dispatch({ type: "setPlot", value: !state.plotReady });
      dispatch({ type: "setPlotExists", value: !state.plotExists });
    };
  }
}
