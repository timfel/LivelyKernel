module('lively.bindings.FRPParser').requires('ometa.lively').toRun(function() {
FRPParser=objectThatDelegatesTo(BSOMetaJSParser,{
"isKeyword":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("anything");return this._pred(this._isKeyword(x))}).call(this)},
"primExpr":function(){var $elf=this,_fromIdx=this.input.idx,p,b,t,i,m,as,f;return this._or((function(){return (function(){p=this._apply("primExpr");return this._or((function(){return (function(){this._applyWithArgs("token","fby");b=this._apply("expr");t=this._or((function(){return (function(){this._applyWithArgs("token","on");return this._apply("expr")}).call(this)}),(function(){return (function(){this._apply("empty");return null}).call(this)}));return ["fby",t,p,b]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","[");i=this._apply("expr");this._applyWithArgs("token","]");return ["getp",i,p]}).call(this)}),(function(){return (function(){this._applyWithArgs("token",".");m=this._applyWithArgs("token","name");this._applyWithArgs("token","(");as=this._applyWithArgs("listOf","expr",",");this._applyWithArgs("token",")");return ["send",m,p].concat(as)}).call(this)}),(function(){return (function(){this._applyWithArgs("token",".");f=this._applyWithArgs("token","name");return ["getp",["string",f],p]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","(");as=this._applyWithArgs("listOf","expr",",");this._applyWithArgs("token",")");return ["call",p].concat(as)}).call(this)}))}).call(this)}),(function(){return this._apply("primExprHd")}))},
"primExprHd":function(){var $elf=this,_fromIdx=this.input.idx,e,n,s,name,as,es;return this._or((function(){return (function(){this._applyWithArgs("token","(");e=this._apply("expr");this._applyWithArgs("token",")");return e}).call(this)}),(function(){return (function(){this._applyWithArgs("token","this");return ["this"]}).call(this)}),(function(){return (function(){n=this._applyWithArgs("token","name");this._applyWithArgs("exactly","\'");return ["getLast",n]}).call(this)}),(function(){return (function(){switch(this._apply('anything')){case ":":return (function(){n=this._applyWithArgs("token","name");return ["gget",n]}).call(this);default: throw fail}}).call(this)}),(function(){return (function(){n=this._applyWithArgs("token","name");return ["get",n]}).call(this)}),(function(){return (function(){n=this._applyWithArgs("token","number");return ["number",n]}).call(this)}),(function(){return (function(){s=this._applyWithArgs("token","string");return ["string",s]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","function");return this._apply("funcRest")}).call(this)}),(function(){return (function(){this._applyWithArgs("token","new");name=this._many((function(){return (function(){n=this._applyWithArgs("token","name");this._or((function(){return (function(){switch(this._apply('anything')){case ".":return ".";default: throw fail}}).call(this)}),(function(){return this._apply("empty")}));return n}).call(this)}));this._applyWithArgs("token","(");as=this._applyWithArgs("listOf","expr",",");this._applyWithArgs("token",")");return ["new",name.join(".")].concat(as)}).call(this)}),(function(){return (function(){this._applyWithArgs("token","[");es=this._applyWithArgs("listOf","expr",",");this._applyWithArgs("token","]");return ["arr"].concat(es)}).call(this)}),(function(){return this._apply("json")}),(function(){return this._apply("re")}))}})
});