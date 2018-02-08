import { Component } from 'react';
import { WdkPageController } from 'wdk-client/Controllers';
import { CheckboxTree } from 'wdk-client/Components';

function isNodeInSearch(node, terms) {
  return terms.some(term => (node.id.includes(term) || node.display.includes(term)));
}

class TreeDataViewer extends Component {

  constructor(props) {
    super(props);
    this.state = {
      text: "",
      expandedNodes: [],
      searchTerm: ""
    };
    this.onTextChange = this.onTextChange.bind(this);
    this.onExpansionChange = this.onExpansionChange.bind(this);
    this.onSearchTermChange = this.onSearchTermChange.bind(this);
  }

  onTextChange(event) {
    this.setState(Object.assign(this.state, {
      text: event.target.value
    }));
  }

  onExpansionChange(expandedNodeNamesArray) {
    this.setState(Object.assign(this.state, {
      expandedNodes: expandedNodeNamesArray
    }));
  }

  onSearchTermChange(searchTerm) {
    this.setState(Object.assign(this.state, {
      searchTerm: searchTerm
    }));
  }

  render() {
    let display = "";
    if (this.state.text != "") {
      try {
        let parsedTree = JSON.parse(this.state.text);
        display = <CheckboxTree
          tree={parsedTree}
          getNodeId={node => node.id}
          getNodeChildren={node => node.children}
          onExpansionChange={this.onExpansionChange}
          showRoot={true}
          nodeComponent={props => <span>{props.node.display}</span>}
          expandedList={this.state.expandedNodes}
          isSelectable={false}
          selectedList={[]}
          isSearchable={true}
          searchBoxPlaceholder="Search..."
          searchBoxHelp="Search the structure below"
          searchTerm={this.state.searchTerm}
          onSearchTermChange={this.onSearchTermChange}
          searchPredicate={isNodeInSearch}/>
      }
      catch (e) {
        display = <span>{e.message}</span>;
      }
    }
    return (
      <div>
        <h3>Tree Data Viewer</h3>
        <p>
          Enter a tree of data in JSON format, where a Node is {"{ id:String, display:String, children:Array[Node] }"}.
        </p>
        <p>
          <textarea value={this.state.text} onChange={this.onTextChange}/>
        </p>
        <div>
          {display}
        </div>
      </div>
    );
  }
}

export default class TreeDataViewerController extends WdkPageController {
  getTitle() { return "Tree Data Viewer"; }
  renderView() { return <TreeDataViewer {...this.props}/> }
}
