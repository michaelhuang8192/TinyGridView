import React  from 'react'
import ReactDOM from 'react-dom'
import {GridView, AjaxAdapter} from '../../../src/TinyGridView'


var adapter = new AjaxAdapter({
  url: '/api/Samples/getWpPage'
});

adapter.getView = function(position) {
  var item = this.getItem(position);
  if(item == null) {
    return (
      <div>
      </div>
    );

  } else {

    return (
      <div>
        <div><img src={"https://wallpaperscraft.com/image/"+item.imgName.replace(/[ ,]+/gi, '_')+"_" + item.imgId} alt="" /></div>
        <div>{item.imgName}</div>
      </div>
    );
  }

};


var DemoListView = React.createClass({

  renderCustomView(gv) {


    return (
      <div id="footer">{gv.state.startPos} - {Math.min(gv.state.endPos, gv.state.itemsCount)} of {gv.state.itemsCount} (Powered By <a href="/web/projects/tiny-grid-view" target="_blank">TinyGridView.JS</a>)</div>
    );

  },

  render() {
    return <GridView adapter={adapter} outterScroll={true} renderCustomView={this.renderCustomView}/>;
  }

});

$(function() {
  
ReactDOM.render(
  <DemoListView />,
  document.getElementById('app')
);

});

