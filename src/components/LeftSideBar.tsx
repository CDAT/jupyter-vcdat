import * as React from 'react';
import { ToastContainer } from 'react-toastify';
import VarList from './VarList';
import GMList from './GMList';
import TemplateList from './TemplateList';

export class LeftSideBar extends React.Component <any> {
    
    render() {
        return (
            <div id="vcdat-left-side-bar">
                <div id="app-container">
                    <div id='main-container'>
                        <div id='left-side-bar'>
                            <VarList
                                variables={{"TestVar1":123,"TestVar2":"The value","Test Variable 3":1234}}
                            />
                            <GMList 
                                variables={{"Graphics Method 1":123,"Method 2":"The value","GMethod 3":1234}}
                            />
                            <TemplateList
                                templates={{"Template 1":123,"Template 2":"The template?","Template 3":1234}}
                            />
                            <ToastContainer />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
