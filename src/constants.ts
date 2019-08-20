import { Step } from "react-joyride";
import reactHtmlParser from "react-html-parser";

export const NO_VERSION: string = "N/A";
export const OLD_VCDAT_VERSION: string = "<=2.0";
export const VCDAT_VERSION: string = "2.1";
export const VCDAT_VERSION_KEY = "vcdat_version";
export const MAX_SLABS: number = 2;
export const MAX_DIM_LENGTH: number = 1000;
export const BASE_URL: string = "/vcs";
export const BASE_DATA_READER_NAME: string = "file_data";
export const READY_KEY: string = "vcdat_ready";
export const EXTENSIONS: string[] = [
  ".nc",
  ".nc3",
  ".nc4",
  ".xml",
  ".ctl",
  ".dic",
  ".pp",
  ".cdf"
];

export const OUTPUT_RESULT_NAME = "_private_vcdat_output";
export const FILE_PATH_KEY: string = "vcdat_file_path";
export const IMPORT_CELL_KEY: string = "vcdat_imports";
export const CANVAS_CELL_KEY: string = "vcdat_canvases";
export const SELECTED_VARIABLES_KEY: string = "selected_variables";
export const VARIABLE_INFO_KEY: string = "vcdat_variable_info";
export const GRAPHICS_METHOD_KEY: string = "graphics_method_selected";
export const TEMPLATE_KEY: string = "template_selected";
export const VARIABLES_LOADED_KEY: string = "vcdat_loaded_variables";
export const REQUIRED_MODULES: string = '["cdms2","vcs","numpy"]';

export const BASE_GRAPHICS: { [dataName: string]: string[] } = {
  "1d": [
    "a_1d",
    "a_scatter_scatter_",
    "a_xvsy_xvsy_",
    "a_xyvsy_xyvsy_",
    "a_yxvsx_yxvsx_",
    "blue_yxvsx",
    "default",
    "default_scatter_",
    "default_xvsy_",
    "default_xyvsy_",
    "default_yxvsx_",
    "quick_scatter",
    "red_yxvsx"
  ],
  "3d_dual_scalar": ["default"],
  "3d_scalar": ["default", "Hovmoller3D"],
  "3d_vector": ["default"],
  boxfill: [
    "a_boxfill",
    "a_lambert_boxfill",
    "a_mollweide_boxfill",
    "a_polar_boxfill",
    "a_robinson_boxfill",
    "default",
    "polar",
    "quick",
    "robinson"
  ],
  isofill: [
    "a_isofill",
    "a_lambert_isofill",
    "a_mollweide_isofill",
    "a_polar_isofill",
    "a_robinson_isofill",
    "default",
    "polar",
    "quick",
    "robinson"
  ],
  isoline: [
    "a_isoline",
    "a_lambert_isoline",
    "a_mollweide_isoline",
    "a_polar_isoline",
    "a_robinson_isoline",
    "default",
    "P_and_height",
    "polar",
    "quick"
  ],
  meshfill: [
    "a_lambert_meshfill",
    "a_meshfill",
    "a_mollweide_meshfill",
    "a_polar_meshfill",
    "a_robinson_meshfill",
    "default"
  ],
  scatter: ["a_scatter_scatter_", "default_scatter_", "quick_scatter"],
  streamline: ["default"],
  taylordiagram: ["default"],
  vector: ["default"],
  xvsy: [
    "a_1d",
    "a_xvsy_xvsy_",
    "a_yxvsx_yxvsx_",
    "blue_yxvsx",
    "default",
    "default_xvsy_",
    "default_yxvsx_",
    "red_yxvsx"
  ],
  xyvsy: ["a_xyvsy_xyvsy_", "default_xyvsy_"],
  yxvsx: [
    "a_1d",
    "a_xvsy_xvsy_",
    "a_yxvsx_yxvsx_",
    "blue_yxvsx",
    "default",
    "default_xvsy_",
    "default_yxvsx_",
    "red_yxvsx"
  ]
};

export const BASE_TEMPLATES: string[] = [
  "default",
  "ASD",
  "ASD_dud",
  "BL_of6_1legend",
  "BLof6",
  "BR_of6_1legend",
  "BRof6",
  "LLof4",
  "LLof4_dud",
  "LRof4",
  "LRof4_dud",
  "ML_of6",
  "ML_of6_1legend",
  "MR_of6",
  "MR_of6_1legend",
  "UL_of6_1legend",
  "ULof4",
  "ULof4_dud",
  "ULof6",
  "UR_of6",
  "UR_of6_1legend",
  "URof4",
  "URof4_dud",
  "bold_mid_of3",
  "bold_top_of3",
  "boldbot_of3_l",
  "boldmid_of3_l",
  "boldtop_of3_l",
  "bot_of2",
  "deftaylor",
  "hovmuller",
  "mollweide2",
  "no_legend",
  "polar",
  "por_botof3",
  "por_botof3_dud",
  "por_midof3",
  "por_midof3_dud",
  "por_topof3",
  "por_topof3_dud",
  "quick",
  "top_of2"
];

// Specifies the states of the Jupyterlab main area tab/notebook
export enum NOTEBOOK_STATE {
  Unknown, // The current state of the notebook is unknown and should be updated.
  NoOpenNotebook, // JupyterLab has no notebook opened
  InactiveNotebook, // No notebook is currently active
  ActiveNotebook, // An active notebook, but needs imports cell
  NoSession, // The active notebook doesn't have a client session running
  InitialCellsReady, // Has imports cell, but they need to be run
  VCS_Ready // The notebook is ready for code injection
}

// Specifies valid plot export formats
export type EXPORT_FORMATS = "png" | "pdf" | "svg" | "ps" | "";
export type IMAGE_UNITS = "px" | "in" | "cm" | "mm" | "dot";

export const GETTING_STARTED: Step[] = [
  {
    content: reactHtmlParser(`This tutorial will help you use the main features
    of the <span style='color: #00426e'>VCDAT ${VCDAT_VERSION}</span>
    JupyterLab extension.<br />
    To quit this tutorial early, click the 'Skip' button. Let's get started!`),
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "center",
    target: "#jp-main-dock-panel",
    title: `VCDAT ${VCDAT_VERSION} Introduction`
  },
  {
    content: reactHtmlParser(
      `This is the VCDAT ${VCDAT_VERSION} tab. Clicking on this tab will toggle 
    the VCDAT panel open and closed. The panel is currently 
    <span style='color: #3ede69'>open</span>.<br />
    Click 'Next' to continue the tutorial...`
    ),
    disableCloseOnEsc: true,
    disableOverlay: true,
    hideCloseButton: true,
    placement: "right",
    target: `#jp-main-content-panel > 
    div.p-Widget.p-TabBar.jp-SideBar.jp-mod-left.p-BoxPanel-child 
    > ul > li.p-TabBar-tab.p-mod-closable > 
    div.p-TabBar-tabIcon.jp-SideBar-tabIcon.jp-icon-vcdat`,
    title: `VCDAT ${VCDAT_VERSION} Icon`
  },
  {
    content: `This is the main VCDAT ${VCDAT_VERSION} panel. From here you can select
    variables, graphics methods and layout templates. You can also choose to
    load variables, plot variables, export plots etc. Let's quickly highlight
    what each button does...`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: "#left-side-bar-vcdat",
    title: `VCDAT ${VCDAT_VERSION} Main Panel`
  },
  {
    content: `When a variable is ready to plot, just click this button and a 
    plot will be rendered.`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: ".vcsmenu-plot-btn-vcdat",
    title: "Plot Button"
  },
  {
    content: `When a plot has been made, click this button to open the export
    options modal where you can export a plot with a specified name and format.`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: ".vcsmenu-export-btn-vcdat",
    title: "Export Plot"
  },
  {
    content: `When you wish to clear the plot canvas, click this button.`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: ".vcsmenu-clear-btn-vcdat",
    title: "Clear"
  },
  {
    content: `When the overlay mode is on, new plots will overlap previous plots.`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: `#left-sidebar > div > div.card > div > div
     > div:nth-child(2) > div > div`,
    title: "Overlay Mode"
  },
  {
    content: `When a plot has been made, click this button to open the export
    options modal where you can export a plot with a specified name and format.`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: ".varmenu-load-variables-btn-vcdat",
    title: "Load Variable"
  },
  {
    content: `This is the graphics dropdown.`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: ".graphics-dropdown-vcdat",
    title: "Graphics Options"
  },
  {
    content: `When you wish to clear the plot canvas, click this button.`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: ".template-dropdown-vcdat",
    title: "Layout Template"
  }
];

export const REPLACEMENT_STEPS: Step[] = [
  {
    content: `The next element in this tutorial was not found. The tutorial will end at this point.`,
    hideCloseButton: true,
    locale: { next: "End" },
    placement: "center",
    showProgress: false,
    target: "#jp-main-dock-panel",
    title: "Tutorial Error"
  },
  {
    content: reactHtmlParser(`This is the VCDAT ${VCDAT_VERSION} tab. Clicking on this tab will toggle 
    the VCDAT ${VCDAT_VERSION} panel open and closed. The panel is currently 
    <span style='color: #3ede69'>closed</span>.<br />
    Open the panel to continue the tutorial...`),
    disableOverlay: true,
    hideCloseButton: true,
    locale: { next: "Exit" },
    placement: "right",
    showProgress: false,
    target: `#jp-main-content-panel > 
      div.p-Widget.p-TabBar.jp-SideBar.jp-mod-left.p-BoxPanel-child 
      > ul > li.p-TabBar-tab.p-mod-closable > 
      div.p-TabBar-tabIcon.jp-SideBar-tabIcon.jp-icon-vcdat`,
    title: `VCDAT ${VCDAT_VERSION} Icon`
  }
];
