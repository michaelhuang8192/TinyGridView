# TinyGridView
A two-dimensional scrolling grid view supports a huge data set without slowing the browser

# Demo
http://tinyappsdev.com/web/projects/tiny-grid-view


# Requirement
* ReactJS
* Webpack

# Example
```
var adapter = new ArrayAdapter();
adapter.getCount = function() { return 99999; }
adapter.getItem = function(position) { return {id: position, name: "Item #" + position}; };

adapter.getView = function(position) {
	var item = this.getItem(position);
	if(item == null) {
		return <div></div>;
	} else {
		return <div><div>{item.name}</div></div>;
	}

};

// render
<GridView
	adapter={adapter}
	outterScroll={true} //optional, respone to main window's scrolling. default: false
	renderCustomView={this.renderCustomView} //optinal, custom view
	onItemClick={this.onItemClick} //optional
	/>

//method:
updateUI(); //should call after any implicit resizing.

```

# License
Free
