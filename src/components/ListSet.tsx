import * as React from 'react';
import List from './List';

/**
 * A component to show a list and performs actions for clicked items
 * 
 * props:
 *  listSet: A dictionary of string arrays listing items to show in drop down.
 *  clickAction: Function to perform when a specific item in the inner list is clicked.
 */

const setStyle = {
    margin: '1px 5px',
    fontWeight: 'bold' as 'bold', // Typescript needs this to be cast to 'bold' type or it will complain
    textDecoration: 'none'
}

type ListSetProps = {
    listSet: any        // an object containing a mapping of catagory names to an array of string items
    clickAction: any    // the function to call when an item has been clicked
}

type ListSetState = {
    activeList: string, // the name of the active list
    activeItem: string, // the name of the active item
    show: string        // the name of the list to show
}

class ListSet extends React.Component <ListSetProps, ListSetState> {

    constructor(props: any){
        super(props)
        this.state = {
            activeList: null,
            activeItem: null, // Get first item and set as active by default
            show: null
        }
        this.listClickHandler = this.listClickHandler.bind(this);
        this.clickItemHandler = this.clickItemHandler.bind(this);
    }
    
    listClickHandler(event: any, listName: string, itemName: string) {
        this.setState({
            activeList: listName, 
            activeItem: itemName,
            show: listName
        });
    }

    clickItemHandler(activeList: string, listItem: string){
        this.setState({
            activeItem: listItem, 
            activeList: activeList
        });
        this.props.clickAction(activeList, listItem);
    }

    render() {
        let listNames: Array<string> = Object.keys(this.props.listSet);
        return (
            <div className='scroll-area'>
                {listNames.map((listName: string, index: number) => {
                    let setItem: JSX.Element = <div></div>;
                    if(this.state.show===listName){
                        setItem = <List
                            activeList={this.state.activeList}
                            activeItem={this.state.activeItem}
                            listName={listName}
                            itemList={this.props.listSet[listName]}
                            clickAction={this.clickItemHandler} />
                    }
                    return (
                        <ul key={index} className='no-bullets left-list active'>
                            <a  href="#" 
                                style={setStyle} 
                                onClick={(event: any) => {
                                    this.listClickHandler(
                                        event,
                                        listName,
                                        this.state.activeItem)
                                    }}>
                                {listName}
                            </a>
                            { setItem }
                        </ul>
                    )
                })}
            </div>
        );
    }
}

export default ListSet;
