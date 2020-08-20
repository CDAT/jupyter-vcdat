// Dependencies
import { Widget } from "@lumino/widgets";
import React, { Ref } from "react";
import * as ReactDOM from "react-dom";

// Project Components
import ErrorBoundary from "./components/ErrorBoundary";
import MainMenu from "./components/menus/NEW_MainMenu";
import AboutPopup, { IAboutRef } from "./components/modals/NEW_AboutPopup";

/**
 * This is the main component for the vcdat extension.
 */
export default class VCDATWidget extends Widget {
  public div: HTMLDivElement; // The div container for this widget
  public showAbout: () => void;

  constructor(rootID: string) {
    super();
    this.div = document.createElement("div");
    this.div.id = rootID;
    this.node.appendChild(this.div);
    this.id = "main-widget-vcdat";
    this.title.iconClass = "jp-SideBar-tabIcon jp-icon-vcdat";
    this.title.closable = true;

    const aboutPopupRef: Ref<IAboutRef> = React.createRef();

    ReactDOM.render(
      <ErrorBoundary>
        <MainMenu />
        <AboutPopup version="Bacon" ref={aboutPopupRef} />
      </ErrorBoundary>,
      this.div
    );

    this.showAbout = (): void => {
      aboutPopupRef.current.show();
    };
  }
}
