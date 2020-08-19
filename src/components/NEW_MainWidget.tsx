// Dependencies
import React, { useState } from "react";

import LabControl from "../modules/LabControl";
import AppControl from "../modules/AppControl";

// Components
import ErrorBoundary from "./ErrorBoundary";
import VCSMenu from "./menus/NEW_VCSMenu";

const MainWidget = (): JSX.Element => {
  const app: AppControl = AppControl.getInstance();
  const lab: LabControl = LabControl.getInstance();

  return (
    <ErrorBoundary>
      <VCSMenu />
    </ErrorBoundary>
  );
};
