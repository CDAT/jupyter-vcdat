import { Step } from "react-joyride";
import reactHtmlParser from "react-html-parser";

export const NO_VERSION = "N/A";
export const OLD_VCDAT_VERSION = "<=2.0";
export const VCDAT_VERSION = "2.3";
export const VCDAT_VERSION_KEY = "vcdat_version";
export const MAX_SLABS = 2;
export const MAX_DIM_LENGTH = 1000;
export const BASE_URL = "/vcs";
export const BASE_DATA_READER_NAME = "file_data";
export const READY_KEY = "vcdat_ready";
export const EXTENSIONS: string[] = [
  ".nc",
  ".nc3",
  ".nc4",
  ".xml",
  ".ctl",
  ".dic",
  ".pp",
  ".cdf",
];

export const OUTPUT_RESULT_NAME = "_private_vcdat_output";
export const FILE_PATH_KEY = "vcdat_file_path";
export const IMPORT_CELL_KEY = "vcdat_imports";
export const CANVAS_CELL_KEY = "vcdat_canvases";
export const SELECTED_VARIABLES_KEY = "selected_variables";
export const VARIABLE_INFO_KEY = "vcdat_variable_info";
export const GRAPHICS_METHOD_KEY = "graphics_method_selected";
export const PLOT_OPTIONS_KEY = "vcdat_plot_options";
export const TEMPLATE_KEY = "template_selected";
export const VARIABLES_LOADED_KEY = "vcdat_loaded_variables";
export const REQUIRED_MODULES = '["cdms2","vcs","numpy","os"]';

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
    "red_yxvsx",
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
    "robinson",
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
    "robinson",
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
    "quick",
  ],
  meshfill: [
    "a_lambert_meshfill",
    "a_meshfill",
    "a_mollweide_meshfill",
    "a_polar_meshfill",
    "a_robinson_meshfill",
    "default",
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
    "red_yxvsx",
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
    "red_yxvsx",
  ],
};

export const BASE_COLORMAPS: string[] = [
  "AMIP",
  "NCAR",
  "bl_to_darkred",
  "bl_to_drkorang",
  "blends",
  "blue2darkorange",
  "blue2darkred",
  "blue2green",
  "blue2grey",
  "blue2orange",
  "blue2orange2red",
  "blue_to_grey",
  "blue_to_grn",
  "blue_to_orange",
  "blue_to_orgred",
  "brown2blue",
  "brown_to_blue",
  "categorical",
  "classic",
  "default",
  "green2magenta",
  "grn_to_magenta",
  "inferno",
  "lightblue2darkblue",
  "ltbl_to_drkbl",
  "magma",
  "plasma",
  "rainbow",
  "rainbow_no_grn",
  "rainbownogreen",
  "sequential",
  "viridis",
  "white2blue",
  "white2green",
  "white2magenta",
  "white2red",
  "white2yellow",
  "white_to_blue",
  "white_to_green",
  "white_to_magenta",
  "white_to_red",
  "white_to_yellow",
];

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
  "top_of2",
];

// Specifies the states of the Jupyterlab main area tab/notebook
export enum NOTEBOOK_STATE {
  Unknown, // The current state of the notebook is unknown and should be updated.
  NoOpenNotebook, // JupyterLab has no notebook opened
  InactiveNotebook, // No notebook is currently active
  ActiveNotebook, // An active notebook, but needs imports cell
  NoSession, // The active notebook doesn't have a client session running
  InitialCellsReady, // Has imports cell, but they need to be run
  VCSReady, // The notebook is ready for code injection
}

// Specifies the display target modes (whether to plot in notebook or on sidecar)
// export type DisplayMode = "notebook" | "sidecar" | "not_set";

export enum DISPLAY_MODE {
  Notebook,
  Sidecar,
  None,
}

// Note: Using reactHtmlParser function, tutorial steps can be rendered as HTML
export const GETTING_STARTED: Step[] = [
  {
    content: reactHtmlParser(`This tutorial will help you use the main features
    of the VCDAT JupyterLab extension.<br />To quit this 
    tutorial early, click <b>Skip</b>. Let's get started!`),
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "center",
    target: "#jp-main-dock-panel",
    title: `VCDAT Introduction`,
  },
  {
    content: reactHtmlParser(
      `The blue stylized "C" on the left is the VCDAT icon. 
    Clicking on this icon will open and close the VCDAT panel.
    To continue, <b>make sure the panel is open</b> before clicking <b>Next</b>,
    otherwise click <b>Skip</b> or leave panel closed to exit tutorial.`
    ),
    disableCloseOnEsc: true,
    disableOverlayClose: true,
    hideCloseButton: true,
    placement: "right",
    spotlightClicks: true,
    target: `#jp-main-content-panel > 
    div.p-Widget.p-TabBar.jp-SideBar.jp-mod-left.p-BoxPanel-child 
    > ul > li.p-TabBar-tab.p-mod-closable > 
    div.p-TabBar-tabIcon.jp-SideBar-tabIcon.jp-icon-vcdat`,
    title: `VCDAT Icon`,
  },
  {
    content: `This is the main VCDAT panel. From here you can load variables, 
    choose graphic plotting methods and layout templates, create a plot and
    export it. Let's quickly highlight what each button does...`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: "#left-side-bar-vcdat",
    title: `VCDAT Main Panel`,
  },
  {
    content: `When a variable is ready to plot, click this button and a 
    plot will be rendered.`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: ".vcsmenu-plot-btn-vcdat",
    title: "Plot Button",
  },
  {
    content: `Once a plot has been created, click this button to open the export
    options window where you can export a plot with a specified name and format.`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: ".vcsmenu-export-btn-vcdat",
    title: "Export Plot",
  },
  {
    content: `When you wish to clear the plot canvas, click this button.`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: ".vcsmenu-clear-btn-vcdat",
    title: "Clear",
  },
  {
    content: `Use this button to load variables from a data file. When clicked,
    the left side panel will switch to the filebrowser where you can double-click 
    on the data file you want to open. Once the file is opened, you can subset
    the variables so not all of the data is loaded. For example, you can constrain
    the latitude and longitude so data from a specific area is loaded instead of
    the whole dataset.`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: ".varmenu-load-variables-file-btn-vcdat",
    title: "Load Variable",
  },
  {
    content: `Use this button to open an input dialog where you can enter a specific
    path to a file you want to open. Once the file is opened, as before, you can subset
    the variables so not all of the data is loaded.`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: ".varmenu-load-variables-path-btn-vcdat",
    title: "Load Variable",
  },
  {
    content: `When the overlay mode is on, new plots will overlap previous plots.
    This allows you to plot isolines on top of a map created using the isofill 
    graphic method, for example.`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: `#graphics-overlay-switch-vcdat`,
    title: "Overlay Mode",
  },
  {
    content: reactHtmlParser(`When the <b>Plot to Sidecar</b> toggle is on, plots will be rendered to the right \
    of the notebook within the <b>Sidecar</b> panel. The sidecar panel will remain on the right until \
    the notebook is closed. If the toggle is left off, plots will be rendered within the notebook.`),
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: `#graphics-sidecar-switch-vcdat`,
    title: "Plot to Sidecar",
  },
  {
    content: reactHtmlParser(`This is the <b>Animate</b> option. When <b>Animate</b> is on, the plot button will be \
    replaced by an <b>Animate</b> button and animation options will appear below this switch. \
    Clicking on the <b>Animate</b> button in the top left, will generate an animation of the \
    selected variable using the specified animation options.
    Note: overlay and sidecar options will be turned off, since they are not supported with animations.`),
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: `#graphics-animation-switch-vcdat`,
    title: "Plot to Sidecar",
  },
  {
    content: `Use this dropdown to choose the type of plot you'd like,
    for example: boxfill, isofill, isoline, etc.`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: ".graphics-dropdown-vcdat",
    title: "Plot Type Dropdown",
  },
  {
    content: `Use the colormap dropdown to choose the colormap you'd like to use,
    for example: blends, categorical, classic, etc.`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: ".colormap-dropdown-vcdat",
    title: "Colormap Dropdown",
  },
  {
    content: `Use this button to change the way the plot looks on the "page".
    For example, you can place up to 6 different plots on a page and that "page"
    can be exported as a single image.`,
    disableCloseOnEsc: true,
    hideCloseButton: true,
    placement: "right",
    target: ".template-dropdown-vcdat",
    title: "Layout Template",
  },
];

export const REPLACEMENT_STEPS: Step[] = [
  {
    content: `The next element in this tutorial was not found. The tutorial will end at this point.`,
    hideCloseButton: true,
    locale: { next: "End" },
    placement: "center",
    showProgress: false,
    target: "#jp-main-dock-panel",
    title: "Tutorial Error",
  },
  {
    content: reactHtmlParser(`The blue stylized "C" on the left is the VCDAT icon. 
    Clicking on this icon will open and close the VCDAT panel.
    The panel is currently <span style='color: red'>closed</span>.<br />
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
    title: `VCDAT Icon`,
  },
];
