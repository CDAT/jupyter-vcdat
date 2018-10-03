import * as React from 'react';

/**
 * A component to show a list and performs actions for clicked items
 * 
 * props:
 *  itemList: An array of strings listing the names to show in drop down.
 *  clickAction: Function to perform when a specific item in the list is clicked.
 *  hidden: A boolean value to show or hide the list
 */

class List extends React.Component <any, any> {

    itemList: Array<string>;
    clickAction: Function;
    hidden: Boolean;
    activeItem: string;

    constructor(props: any){
        super(props)
        this.state = {
            showFile: false,
            showEdit: false
        }
        this.clickAction = this.clickAction.bind(this);
    }
    
    clickHandler(event: any,itemName: string) {
        console.log("Item: " + itemName + " was clicked. Event: " + event);
        this.props.clickAction(itemName);
    }

    render() {

        return (
            <div className='scroll-area'>
                <ul id='var-list' className='no-bullets left-list'>
                    {this.props.itemList.forEach((itemName: string) => {
                        return(
                            <li className="active">
                                <a href="#" onClick={(e) => this.clickHandler(e,itemName)}>{itemName}</a>
                            </li>
                        ) 
                    })}
                </ul>
            </div>
        )
    }
}

export default List;
