import React  from 'react'
import ReactDOM from 'react-dom'
import {GridView, AjaxAdapter} from '../../../src/TinyGridView'


var adapter = new AjaxAdapter({
  url: '/api/Samples/getWpPage'
});

adapter.getView = function(position) {
  var item = this.getItem(position);
  return <CardView item={item} imageDelay={200} />;
};


var CardView = React.createClass({

  //delay images loading from random scrolling
  __delayImageLoading(item) {
    this.setState({
      src: item && "loading2.gif",
      _src: item && "https://wallpaperscraft.com/image/"+item.imgName.replace(/[ ,]+/gi, '_')+"_" + item.imgId 
    });

    if(!item) return;

    var _this = this;
    this.timer = setTimeout(function() {
      _this.timer = null;
      _this.setState({src: _this.state._src});
    }, this.props.imageDelay);

  },

  componentWillMount() {
    this.__delayImageLoading(this.props.item);
  },

  componentWillReceiveProps(nextProps) {
    if(nextProps.item != this.props.item) {
      if(this.timer) { clearTimeout(this.timer); this.timer = null; }
      this.__delayImageLoading(nextProps.item);
    }
  },

  render() {
    var item = this.props.item;
    if(item == null) return <div><div></div><div></div></div>;

    return (
    <div>
        <div><img src={this.state.src} alt="" /></div>
        <div>{item.imgName}</div>
    </div>
    );
  }

});


var DemoListView = React.createClass({

  renderCustomView(gv) {
    return (
      <div id="footer">{gv.state.startPos} - {Math.min(gv.state.endPos, gv.state.itemsCount)} of {gv.state.itemsCount} (Powered By <a href="/web/projects/tiny-grid-view" target="_blank">TinyGridView.JS</a>)</div>
    );

  },

  render() {
    return <GridView adapter={adapter} renderCustomView={this.renderCustomView}/>;
  }

});

$(function() {
  
ReactDOM.render(
  <DemoListView />,
  document.getElementById('app')
);

});

