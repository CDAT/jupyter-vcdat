=================================
Coding Guidelines
=================================

The following is a set of coding guidelines that all code submitted to this project must follow. The overall goal of these guidelines is to increase code readability, maintainability, and consistency, as well as ensure that the code written is testable without excessive workarounds. 

- Naming conventions:

  + newfolder
  + NewFile
  + NewClass
  + newFunction
  + new_variable

- Filenames should correspond to the class exported by default.

  + Example: `import CoolClass from './cool/CoolClass.js'`

- Components that need css should create a folder of the same name

  + Example: `src/js/components/CoolClass/Coolclass.js` and `src/js/components/CoolClass/Coolclass.scss`

- No console.log()

  + Generally console.log should be for debugging only. Use console.warn or console.error when errors or unexpected states are encountered.

- Component testing suggestions:

  + New components: >80%
  + Legacy components 50%

Style guidelines:
=================

Avoid conditional element selecting such as described here: `Conditional Rendering - React <https://reactjs.org/docs/conditional-rendering.html#inline-if-with-logical--operator/>`_

Avoid declaring components or classes with the generic 'any' type in order to make the props and state requirements of the component more clear:

Rather than using:

::

    export class MyComp extends React.Component<any, any> { ...

You should use:

::

    type MyCompProps = {
    compName: string,
    compTitle: string,
    compID: number,
    };
    type MyCompState = {
    file_path: string,
    templates: any,
    showMyComp: boolean,
    activeVariable: string
    };

    export class MyComp extends React.Component<MyCompProps, MyCompState> { ...

+ Avoid creating difficult to understand React markup like this:

::

    <div className={'plot-var second-var ' + (this.isVector()
        ? 'colored-second-var'
            : '')}>
                {(this.props.plot.variables.length > 1 && this.props.plot.variables[1]
        ? this.props.plot.variables[1]
            : '')}
    </div>

Instead of something like this:

::

    let dimensions = this.state.dimension && this.state.dimension.length > 0 ? this.state.dimension : [];

Make it easier to eard like this:

::

    if(this.state.dimension && this.state.dimension.length > 0){
        let dimensions = this.state.dimensions;
    } else {
        let dimensions = [];
    }

+ Every React component should be well documented with a comment block showing expected props, like in this example:

::

    /**
    * A component that contains a modal that allows the user to select axis`
    *  and subset data from the axis
    *
    * props:
    *  variable: string, the name of the selected variable
    *  file_path: string, the path to the file containing the variable
    *
    |*/

    .
    .
    .

    class MyComp extends React.Component<MyCompProps, MyCompState> {
            constructor(props) {
        super(props);
    }
