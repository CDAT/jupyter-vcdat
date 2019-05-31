import { Utilities } from "./Utilities";
export const MAX_SLABS: number = 2;
export const MAX_DIM_LENGTH: number = 1000;
export const BASE_URL: string = "/vcs";
export const BASE_DATA_READER_NAME: string = "file_data";
export const READY_KEY: string = "vcdat_ready";
export const EXTENSIONS: string[] = [
  ".nc",
  ".nc3",
  ".nc4",
  ".ctl",
  ".dic",
  ".pp",
  ".cdf",
  ".xml"
];

export const EXTENSIONS_REGEX: RegExp = Utilities.filenameFilter(EXTENSIONS);
export const OUTPUT_RESULT_NAME = "_private_vcdat_output";
export const FILE_PATH_KEY: string = "vcdat_file_path";
export const IMPORT_CELL_KEY: string = "vcdat_imports";
export const CANVAS_CELL_KEY: string = "vcdat_canvases";
export const SELECTED_VARIABLES_KEY: string = "selected_variables";
export const VARIABLE_INFO_KEY: string = "vcdat_variable_info";
export const GRAPHICS_METHOD_KEY: string = "graphics_method_selected";
export const TEMPLATE_KEY: string = "template_selected";
export const VARIABLES_LOADED_KEY: string = "vcdat_loaded_variables";
export const REQUIRED_MODULES: string = '["cdms2","vcs","sidecar"]';

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
