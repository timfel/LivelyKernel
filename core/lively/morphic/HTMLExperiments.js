module('lively.morphic.HTMLExperiments').requires('lively.morphic.HTML').toRun(function() {


cop.create('lively.morphic.RelativeLayer').refineClass(lively.morphic.Morph, {
	adjustOrigin: function() {},
	relativeWrapper: function() {return true},

	triggerEventHTML: function(ctx, evt) {
		return ctx.shapeNode ? ctx.shapeNode.dispatchEvent(evt) : null;
	},
	appendHTML: function(ctx, optMorphAfter) {
		if (!ctx.morphNode) throw dbgOn(new Error('no ctx.morphNode!'));
		console.log("Adding a relative morph!");
		var parentNode = false;//ctx.morphNode.parentNode;
		if (!parentNode) {
			var ownerCtx = this.owner && this.owner.renderContext();
			parentNode = (ownerCtx && ownerCtx.shapeNode) || ctx.parentNode;
			if (this.owner.getShape().constructor.name === "HTMLShape") {
				this.getShape().renderUsing(ctx);
				  parentNode = ownerCtx.shapeNode;
				  parentNode.appendChild(ctx.shapeNode);
			}
			else if (parentNode && ownerCtx && ownerCtx.shapeNode && parentNode === ownerCtx.shapeNode) {

				if (!ownerCtx.originNode) {
					ownerCtx.originNode = ownerCtx.domInterface.htmlRect();
					ownerCtx.shapeNode.appendChild(ownerCtx.originNode);
				}
				this.owner.shape.compensateShapeNode(ownerCtx);
				parentNode = ownerCtx.originNode;

				var afterNode = optMorphAfter && optMorphAfter.renderContext().getMorphNode();
				this.insertMorphNodeInHTML(ctx, ctx.morphNode, parentNode, afterNode);
				this.getShape().renderUsing(ctx);
			}
		}


	},
	remove: function() {
		this.suspendSteppingAll();
		if (this.showsHalos) this.removeHalos();
		this.renderContextDispatch('remove');
		this.removeWithLayer(lively.morphic.RelativeLayer);
	},
	removeHTML: function(ctx) {
		this.owner && this.owner.removeMorph(this);
		ctx.removeNode(ctx.shapeNode);
	},
	getBounds: function() {
		var p = this.getPosition();
		var e = this.getExtent();
		return new Rectangle(p.x, p.y, e.x, e.y);
	},

	getPosition: function() {
		var ctx = this.renderContext();
		if (this.owner && ctx.shapeNode && ctx.shapeNode.parentNode) {

			var ownerOffset = (this.owner.relativeWrapper && this.owner.relativeWrapper()) ?
				$(ctx.shapeNode.parentNode).offset() :             // take the owner's shapeNode as reference
				$(ctx.shapeNode.parentNode.parentNode).offset(); // look in the morphNode, not in the shapeNode!

			var thisOffset = $(ctx.shapeNode).offset();
			return pt(thisOffset.left - ownerOffset.left,   thisOffset.top- ownerOffset.top)
		} else {
			//console.log('Relative Morph is obviously not ready to get checked for its position. Maybe it does not have an owner morph yet?');
			return pt(0,0)
		}

	},

	getRotation: function() {
		return 0;
	},
	getScale: function() {
		return 1;
	},

	setPositionHTML: function(ctx) {},

	setRotationHTML: function(ctx) {},

	setScaleHTML: function(ctx) {},

	}
);

lively.morphic.Morph.subclass('lively.morphic.HTMLMorph',
'settings', {
    tagName: 'div',
    isRelative: true
},
'HTML render settings', {
    htmlDispatchTable: {
        setContent: 'setContentHTML',
        setAttribute: 'setAttributeHTML',
        getAttribute: 'getAttributeHTML',
        setProp: 'setPropHTML',
        getProp: 'getPropHTML',
     },
},
'initializing', {
    initialize: function($super, tagName, optBounds) {
            if (tagName) this.tagName = tagName;
            $super(new lively.morphic.Shapes.HTMLShape(this.tagName, optBounds));
    },
    appendHTML: function($super, ctx) {
        $super(ctx);
        if (this.content) this.setContentHTML(ctx, this.content);
        if (this.attributes) for (var x in this.attributes) {
            this.setAttribute(this.attributes[x].attr, this.attributes[x].val);
        }
    }

},

'accessing',{
    setExtent: function(value) {

      this.shape.setExtent(value);
      if (this.layout && (this.layout.adjustForNewBounds || this.layout.layouter))
            this.adjustForNewBounds();
      if (this.owner && (typeof this.owner['submorphResized'] == 'function')) {
            this.owner.submorphResized(this);
        }
      return value;
    },
    resetExtent: function() {
        this.shape.resetExtent();
    },
    setContent: function(content){
        this.renderContextDispatch('setContent', content);
    },
    setContentHTML: function(ctx, content){
        this.content = content;
        if (ctx.contentNode) $(ctx.contentNode).remove();
            ctx.contentNode = document.createTextNode(content);
            ctx.shapeNode.appendChild(ctx.contentNode);
    },
    getContent: function(){
        return this.content || "";
    },
    getBounds: function() {
        return this.getPosition().extent(this.getExtent());
    },
    addMorph: function($super, morph, optMorphBefore) {

         if (morph.isAncestorOf(this)) {
            alert('addMorph: Circular relationships between morphs not allowed');
            alert('tried to drop ' + morph + ' on ' + this);
            return;
        }

        if (morph.owner) {
            var tfm = morph.transformForNewOwner(this);
            morph.remove();
        }

        // enable Relative Layout Layer (between removing and adding)
        morph.addWithLayer(lively.morphic.RelativeLayer);

        if (morph.owner !== this) morph.owner = this;

        var indexToInsert = optMorphBefore && this.submorphs.indexOf(optMorphBefore);
        if (indexToInsert === undefined || indexToInsert < 0)
            indexToInsert = this.submorphs.length;
        this.submorphs.pushAt(morph, indexToInsert);

        // actually this should be done below so that geometry connects works correctly
        // but for the current Chrome stable (12.0.7) this leads to a render bug (morph is offseted)
        if (tfm) {
            morph.setTransform(tfm);
        }

        var parentRenderCtxt = this.renderContext(),
            subRenderCtxt = morph.renderContext(),
            ctx = parentRenderCtxt.constructor !== subRenderCtxt.constructor ?
                parentRenderCtxt.newForChild() : subRenderCtxt;
        morph.renderAfterUsing(ctx, optMorphBefore);

        morph.resumeSteppingAll();

        if (this.getLayouter()) {
            this.getLayouter().onSubmorphAdded(this, morph, this.submorphs);
        }
        if (morph.owner.owner) { // Is owner owner a stack?
            if (morph.owner.owner.pageArray) {
                morph.pageSpecific = true; // dropped morph is only on this page
                    // call Stack.beInBackground to place in background
            }
        }
        return morph

    },

    getAttribute: function(attribute) {
        this.renderContextDispatch('getAttribute', attribute);
    },
    getAttributeHTML: function(ctx, attribute) {
        return $(ctx.shapeNode).attr(attribute);
    },
    setAttribute: function(attribute, value) {
        if (!this.attributes) this.attributes = [];
        this.attributes.push({attr: attribute, val: value}); // FIXME! Need a key value list here
        this.renderContextDispatch('setAttribute', {attr: attribute, val: value});
    },
    setAttributeHTML: function(ctx, attrVal) {

        if (attrVal.val) $(ctx.shapeNode).attr(attrVal.attr, attrVal.val);
        else ctx.shapeNode.removeAttribute(attrVal.attr);
    },
    getProp: function(prop) {
        return this.renderContextDispatch('getProp', prop);
    },
    getPropHTML: function(ctx, prop) {
        return $(ctx.shapeNode).prop(prop);
    },
    setProp: function(prop, value) {
        if (!this.prop) this.props= [];
        this.props.push({prop: prop, val: value}); // FIXME! Need a key value list here
        this.renderContextDispatch('setProp', {prop: prop, val: value});
    },
    setPropHTML: function(ctx, propVal) {
        $(ctx.shapeNode).prop(propVal.prop, propVal.val);
    },

    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            'Set content', function(evt) {
            $world.prompt('Set content', function(input) {
                if (input !== null)
                    self.setContent(input || '');
            }, self.getContent());
        }]);
        items.push([
            'Reset extent', function(evt) {
                self.resetExtent();
        }]);
        return items;
    },
    addEventHandler: function() {
        if (this.eventHandler) throw new Error('Morph ' + this + ' already has an event handler!');
        var handler = new lively.morphic.ShapeEventHandler(this);
        this.eventHandler = handler;
        return handler;
    },

}


);




lively.morphic.Shapes.Shape.subclass('lively.morphic.Shapes.HTMLShape',
'documentation', {
    documentation: 'an HTMLMorph shape',
},
'initializing', {

    htmlDispatchTable: {
        resetExtent: 'resetExtentHTML',
     },

    initialize: function($super, tagName, optBounds){
        this.tagName = tagName;
        $super(optBounds);
    },
    
    initHTML: function(ctx) {
        if (!ctx.shapeNode)
            ctx.shapeNode = XHTMLNS.create(this.tagName);
        if (this.extentOverride) {
            this.setRawExtentHTML(ctx, this.extentOverride);
        }
        this.getNodeClass() && this.setNodeClassHTML(ctx, this.getNodeClass());
        if (this.getNodeId()) {
            this.setNodeIdHTML(ctx, this.getNodeId());
            this.getStyleSheet && this.setStyleSheetHTML(ctx, this.getStyleSheet());
        }
    },

},
'updating', {
    resetExtent: function() {
        this.renderContextDispatch('resetExtent');     
    },
    resetExtentHTML: function(ctx){
        this.extentOverride = null;
        ctx.shapeNode.style.width = null;
        ctx.shapeNode.style.height = null;         
    },
    getBounds: function() {
        return pt(0,0).extent(this.getExtent())
    },
    getPosition: function() {
            return pt(0,0);
    },
    setPositionHTML: function(ctx, value) {
        if (!ctx.shapeNode) return undefined;
        ctx.domInterface.setPosition(ctx.shapeNode, value);
    },
    setExtentHTML: function(ctx, value) {
        if (!ctx.shapeNode) return undefined;
        var newExtent = value;

        var n = ctx.shapeNode.nodeName;

        if (n != "button" && n != "input" && n != "textarea") {
        // some nodetypes adhere to the standard box model, some don't ...
            var outer = this.getExtent();
            var inner = pt($(ctx.shapeNode).width(), $(ctx.shapeNode).height());
            var delta = outer.subPt(inner);
            newExtent = newExtent.subPt(delta);
        }
        else if (n == "textarea") {
            // FIXME: with SAPUI5 CSS applied this does not work right
            var outer= this.getExtent();
            var inner = pt($(ctx.shapeNode).width(), $(ctx.shapeNode).height());
            var delta = outer.subPt(inner);
            newExtent = newExtent.subPt(delta);
        }

        this.setRawExtentHTML(ctx, newExtent);


        return value;
    },
    setRawExtentHTML: function(ctx, extent) {
        //$(ctx.shapeNode).width(extent.x);         
        ctx.shapeNode.style.width = extent.x+"px";
        var both = (extent.y > 0) 
        if (both) {
            //$(ctx.shapeNode).height(extent.y); 
            ctx.shapeNode.style.height= extent.y+"px";
        }
        else {
            //$(ctx.shapeNode).css('height', '');
            ctx.shapeNode.style.height = null;
        }
        this.extentOverride = (both) ?  extent : extent.withY(0);
    },
    getExtent: function(){
        var ctx = this.renderContext();
        var w = $(ctx.shapeNode).outerWidth(true);
        var h = $(ctx.shapeNode).outerHeight(true);
        return pt(w, h);
    },
/*
    setFillHTML: function(ctx, value) {},

    setBorderStyleHTML: function(ctx, value) {},
    setBorderWidthHTML: function(ctx, width) {},
    setBorderHTML: function(ctx, width, fill, opacity) {},

    setOpacityHTML: function(ctx, value) {},
    setPaddingHTML: function(ctx, r) {},
*/
    compensateShapeNode: function(ctx) {},
    


}
);

lively.morphic.EventHandler.subclass('lively.morphic.ShapeEventHandler',
    '.', {
    registerHTMLAndSVG: function(eventSpec) {
        var handler = this;
        eventSpec.node = eventSpec.node || this.morph.renderContext().shapeNode;
        if (!eventSpec.node) {
            throw new Error('Cannot register Event handler because cannot find '
                            + 'HTML/SVG morphNode');
        }
        eventSpec.doNotSerialize = ['node'];
        // bind is too expensive here
        eventSpec.handlerFunc = function(evt) { handler.handleEvent(evt); };
        eventSpec.unregisterMethodName = 'unregisterHTMLAndSVGAndCANVAS';
        eventSpec.node.addEventListener(
            eventSpec.type, eventSpec.handlerFunc, eventSpec.handleOnCapture);
        this.register(eventSpec);
    },
});




}) // end of module