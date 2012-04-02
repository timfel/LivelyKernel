module('lively.morphic.tt').requires().toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.testxx',
'method category', {
    initialize: function($super) {
        $super(new lively.morphic.Shapes.Rectangle(new Rectangle(0,0,100,100)))
        this.setFill(Color.red)
    },
    addMorph: function($super, morph) {
        $super(morph);
    },
    newMethod: function() {},
});

}) // end of module