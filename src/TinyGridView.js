import React  from 'react'


function Adapter() {
	this._observers = [];

}

Adapter.prototype.getCount = function() {
	return 0;
};

Adapter.prototype.getItem = function(position) {
	return null;
};

Adapter.prototype.getView = function(position) {
	return null;
};

Adapter.prototype.registerDataSetObserver = function(observer) {
	if(this._observers.indexOf(observer) >= 0) return;

	this._observers.push(observer);
	observer();
};

Adapter.prototype.unregisterDataSetObserver = function(observer) {
	var idx = this._observers.indexOf(observer);
	if(idx >= 0)
		this._observers.splice(idx, 1);
};

Adapter.prototype.notifyDataSetChanged = function() {
	for(var i = 0; i < this._observers.length; i++)
		this._observers[i]();
};


function ArrayAdapter(arrayList) {
	Adapter.call(this);
	this.arrayList = arrayList || [];
}

ArrayAdapter.prototype = Object.create(Adapter.prototype);
ArrayAdapter.prototype.constructor = ArrayAdapter;

ArrayAdapter.prototype.getCount = function() {
	return this.arrayList.length;
};

ArrayAdapter.prototype.getItem = function(position) {
	return this.arrayList[position];
};


function AjaxAdapter(cfg) {
	Adapter.call(this);

	this.cfg = $.extend({}, cfg || {});
	this.cfg.pageSize = this.cfg.pageSize || 50;

	this._total = 1;
	this._pages = {};

	this._failed = 0;

	this._ajaxRequest = null;
}

AjaxAdapter.prototype = Object.create(Adapter.prototype);
AjaxAdapter.prototype.constructor = AjaxAdapter;

AjaxAdapter.prototype.getCount = function() {
	return this._total;
};

AjaxAdapter.prototype.clear = function(shouldNotNotify) {
	this._total = 0;
	this._pages = {};
	this._failed = 0;
	if(this._ajaxRequest != null) {
		this._ajaxRequest.abort();
		this._ajaxRequest = null;
	}
	shouldNotNotify || this.notifyDataSetChanged();
};

AjaxAdapter.prototype.refresh = function(shouldNotNotify) {
	this.clear(true);
	this._total = 1;
	shouldNotNotify || this.notifyDataSetChanged();
};

AjaxAdapter.prototype.getItem = function(position) {
	var pageSize = this.cfg.pageSize;
	var pageIndex = Math.floor(position / pageSize);
	var rowIndex = position % pageSize;
	var page = this._pages[pageIndex];

	if(page === null) return null;
	if(page === undefined) {
		if(pageIndex >= 0) this.loadPage(pageIndex);
		return null;
	}

	return page[rowIndex];
};

AjaxAdapter.prototype.onData = function(pageIndex, data) {
	var total = data.total;
	var pages = data.pages;

	if(this._total != total) {
		this._pages = {};
	}

	this._total = total;
	this._pages[pageIndex] = pages[pageIndex] === undefined ? null : pages[pageIndex];
};



AjaxAdapter.prototype.loadPage = function(pageIndex) {
	if(this._ajaxRequest != null) return;

	var params = $.extend(
		{},
		this.cfg.params,
		{pageIndex: pageIndex, pageSize: this.cfg.pageSize}
	);
	if(this.cfg.method == 'post')
		this._ajaxRequest = $.post(this.cfg.url, params, null, 'json');
	else
		this._ajaxRequest = $.get(this.cfg.url, params, null, 'json');

	var _this = this;
	this._ajaxRequest.done(function(data, textStatus, jqXHR) {
		_this.onData(pageIndex, data);
		_this._failed = 0;

	}).fail(function(jqXHR, textStatus, errorThrown) {
		_this._failed++;
		console.log("Failed -> " + errorThrown);

	}).always(function() {
		_this._ajaxRequest = null;
		if(_this._failed <= 2)
			_this.notifyDataSetChanged();

	});

};

var ViewItem = React.createClass({

	componentWillMount: function() {
		this.setState({
			position: this.props.position,
			selected: this.props.selected
		});
	},

	componentWillReceiveProps(nextProps) {
		if(nextProps.version != this.props.version || nextProps.position >= 0) {
			this.setState({
				position: nextProps.position,
				selected: nextProps.selected
			});
		}

	},

	shouldComponentUpdate(nextProps, nextState) {
		if(nextProps.version != this.props.version) {
			return true;
		} else if(nextState.position != this.state.position 
			|| nextState.selected != this.state.selected)
		{
			return true;
		}

		return false;
	},

	_onClick: function() { 
		this.props.onItemClick(this.state.index, this.state.position);
	},

	render: function() {
		var className = "tgv_item";
		if(this.state.selected) className += " tgv_item_active";

		var row = this.props.adapter.getView(this.state.position);

		var offset = Math.floor(this.props.colWidth - this.props.itemSize.width) / 2;
		var top = Math.floor(this.state.position / this.props.numItemsPerRow) * this.props.itemSize.height;
		var left = Math.floor((this.state.position % this.props.numItemsPerRow) * this.props.colWidth) + offset;
		var style = {
			top: top + "px",
			left: left + "px",
			width: this.props.itemSize.width + "px",
			height: this.props.itemSize.height + "px",
			display: this.state.position < 0 ? 'none' : 'block'
		};
		return (
			<div style={style} className={className} onClick={this._onClick}>{row}</div>
		);
	}

});

var DEFAULT_ITEM_SIZE = 120;
var GridView = React.createClass({
	scrollDelay: null,
	scrollContainer: null,
	origItemSize: {width: 0, height: 0},
	curItemSize: {width: 0, height: 0},
	bodyWidth: 0,
	containerHeight: 0,
	numItemsPerRow: 1,
	bodyPosTop: 0,
	virtualItemsCount: 0,
	colWidth: 0,

	__resize() {
		//console.log("__resize");
		var body = $(this.refs['body']);
		var bodyPosTop = this.props.outterScroll ? body.offset().top : body.position().top;
		var bodyWidth = body.width();
		var containerHeight = this.scrollContainer.height();
		
		if(bodyWidth == this.bodyWidth
			&& containerHeight == this.containerHeight
			&& bodyPosTop == this.bodyPosTop)
		{
			return false;
		}
		
		this.bodyWidth = bodyWidth;
		this.containerHeight = containerHeight;
		this.bodyPosTop = bodyPosTop;
		this.numItemsPerRow = Math.max(1, Math.floor(bodyWidth / this.origItemSize.width));
		this.colWidth = this.bodyWidth / this.numItemsPerRow;

		if(this.props.stretchMode == 1) {

		} else {
			this.curItemSize.width = this.origItemSize.width;
			this.curItemSize.height = this.origItemSize.height;
		}

		var numItemPerContainer = (Math.ceil(containerHeight / this.curItemSize.height) + 1) * this.numItemsPerRow;
		this.virtualItemsCount = Math.max(
			Math.max(20, (Math.ceil(numItemPerContainer * 1.5) + 1) & ~1 ),
			this.virtualItemsCount
		);

		return true;
	},

	_getVirtualView: function() {
		if(this.scrollContainer == null) return null;

		var container = this.scrollContainer;
		var body = $(this.refs['body']);

		var start = Math.min(
			Math.max(0, container.scrollTop() - this.bodyPosTop),
			body.height()
		);
		var end = start + this.containerHeight;

		var startPos = Math.floor(start / this.curItemSize.height) * this.numItemsPerRow;
		var endPos = Math.ceil(end / this.curItemSize.height) * this.numItemsPerRow;

		return {
			startPos: startPos,
			endPos: endPos
		};
	},

	_onResize: function() {
		if(this.__resize()) {
			this.setState(
				$.extend({}, this._getVirtualView(), {version: this.state.version + 1})
			);
		}
	},

	updateUI: function() {
		this._onResize();
	},

	_onScroll: function() {
		//console.log("_onScroll");
		if(this.scrollDelay !== null) return;

		var _this = this;
		this.scrollDelay = setTimeout(function() {
			_this.scrollDelay = null;
			
			var virtualView = _this._getVirtualView();
			if(virtualView == null) return;
			if(virtualView.startPos != _this.state.startPos
				|| virtualView.endPos != _this.state.endPos)
				_this.setState(virtualView);

		}, 50);

	},

	_change: function() {
		this.setState({
			itemsCount: this.props.adapter.getCount(),
			version: this.state.version + 1
		});
	},

	_onClick: function(position) {
		if(position != this.state.curPosition) {
			this.setState({curPosition: position});
		}

		this.props.onItemClick && this.props.onItemClick(position);
	},

	shouldComponentUpdate: function(nextProps) {
		if(nextProps.shouldNotRender)
			return false;
		return true;
	},

	componentWillMount: function() {
		this.setState({
			startPos: 0,
			endPos: 0,
			itemsCount: 0,
			version: 0,
			curPosition: -1,
		});
	},

	render: function() {
		var rows = [];
		if(this.origItemSize.width <= 0 || this.origItemSize.height <= 0) {
			rows.push(<div key={-1} className="tgv_item" ref="hidden_item" style={{visibility: 'hidden'}}></div>);
		} else {
			var virtualItemsCount = this.virtualItemsCount;
			var positions = new Array(virtualItemsCount);
			var endpos = Math.min(this.state.itemsCount, this.state.endPos);
			for(var i = this.state.startPos; i < endpos; i++) {
				positions[i % virtualItemsCount] = i;
			}

			for(var i = 0; i < virtualItemsCount; i++) {
				var position = positions[i] === undefined ? -1 : positions[i];
				var selected = position >= 0 && this.state.curPosition == position;
				rows.push(
				<ViewItem
					adapter={this.props.adapter}
					key={i}
					position={position}
					selected={selected}
					version={this.state.version}
					onItemClick={this._onClick}
					itemSize={this.curItemSize}
					colWidth={this.colWidth}
					numItemsPerRow={this.numItemsPerRow}
					/>
				);
			}
		}

		var height = this.curItemSize.height * Math.ceil(this.state.itemsCount / this.numItemsPerRow);
		var style = $.extend({}, this.props.style || {}, {height: height + "px"});

		var className = this.props.className != null ? "tgv_body " + this.props.className : "tgv_body";
		return (
		<div className={"tinygridview" + (!this.props.outterScroll ? " tinygridview_innerscroll" : "")} ref="scrollContainer">
			<div className={className} ref="body" style={style}>{rows}</div>
			{this.props.renderCustomView && this.props.renderCustomView(this)}
		</div>
		);

	},

	componentDidMount: function() {
		$(window).on('resize', this._onResize);

		this.scrollContainer = this.props.outterScroll ? $(window) : $(this.refs['scrollContainer']);
		var container = this.scrollContainer;
		container.on('scroll', this._onScroll);

		var hidden_item = $(this.refs['hidden_item']);
		this.origItemSize.height = hidden_item.height() || DEFAULT_ITEM_SIZE;
		this.origItemSize.width = hidden_item.width() || DEFAULT_ITEM_SIZE;
		
		this.__resize();

		var virtualView = this._getVirtualView();
		this.state.startPos = virtualView.startPos;
		this.state.endPos = virtualView.endPos;
		
		this.props.adapter.registerDataSetObserver(this._change);
	},

	componentWillUnmount: function() {
		$(window).off('resize', this._onResize);
		this.scrollContainer.off('scroll', this._onScroll);

		this.props.adapter.unregisterDataSetObserver(this._change);

		if(this.scrollDelay !== null) {
			clearTimeout(this.scrollDelay);
			this.scrollDelay = null;
		}

		this.scrollContainer = null;
	}

});

module.exports = {
	GridView: GridView,
	AjaxAdapter: AjaxAdapter,
	ArrayAdapter: ArrayAdapter,
};