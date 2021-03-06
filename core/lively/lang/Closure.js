module('lively.lang.Closure').requires().toRun(function() {

///////////////////////////////////////////////////////////////////////////////
// Class defintion: lively.Closure
///////////////////////////////////////////////////////////////////////////////

Object.subclass('lively.Closure',
'documentation', {
    documentation: 'represents a function and its bound values'
},
'settings', {
    isLivelyClosure: true
},
'serialization', {
    doNotSerialize: ['originalFunc']
},
'initializing', {
    initialize: function(func, varMapping, source, funcProperties) {
        this.originalFunc = func;
        this.varMapping = varMapping || {};
        this.source = source;
        this.setFuncProperties(func || funcProperties);
    }
},
'accessing', {
    setFuncSource: function(src) {
        this.source = src
    },

    getFuncSource: function() {
        return this.source || String(this.originalFunc)
    },

    hasFuncSource: function() {
        return this.source && true
    },

    getFunc: function() {
        return this.originalFunc || this.recreateFunc()
    },

    getFuncProperties: function() {
        // a function may have state attached
        if (!this.funcProperties) this.funcProperties = {};
        return this.funcProperties;
    },

    setFuncProperties: function(obj) {
        var props = this.getFuncProperties();
        for (var name in obj) {
            // The AST implementation assumes that Function objects are some
            // kind of value object. When their identity changes cached state
            // should not be carried over to new function instances. This is a
            // pretty intransparent way to invalidate attributes that are used
            // for caches.
            // @cschuster, can you please fix this by making invalidation more
            // explicit?
            if (obj.hasOwnProperty(name) && name != "_cachedAst") {
                props[name] = obj[name];
            }
        }
    },

    lookup: function(name) {
        return this.varMapping[name]
    },

    parameterNames: function(methodString) {
        var parameterRegex = /function\s*\(([^\)]*)\)/,
            regexResult = parameterRegex.exec(methodString);
        if (!regexResult || !regexResult[1]) return [];
        var parameterString = regexResult[1];
        if (parameterString.length == 0) return [];
        var parameters = parameterString.split(',').collect(function(str) {
            return Strings.removeSurroundingWhitespaces(str)
        }, this);
        return parameters;
    },

    firstParameter: function(src) {
        return this.parameterNames(src)[0] || null;
    }

},
'function creation', {

    recreateFunc: function() {
        return this.recreateFuncFromSource(this.getFuncSource(), this.originalFunc);
    },

    recreateFuncFromSource: function(funcSource, optFunc) {
        // what about objects that are copied by value, e.g. numbers?
        // when those are modified after the originalFunc we captured
        // varMapping then we will have divergent state
        var closureVars = [],
            thisFound = false,
            specificSuperHandling = this.firstParameter(funcSource) === '$super';
        for (var name in this.varMapping) {
            if (!this.varMapping.hasOwnProperty(name)) continue;
            if (name == 'this') {
                thisFound = true;
                continue;
            }
            closureVars.push(name + '=this.varMapping["' + name + '"]');
        }
        // FIXME: problem with rewriting variables when _2 is rewritten by eval below
        // if (this.originalFunc && this.originalFunc.livelyDebuggingEnabled) {
        //     var scopeObject = this.originalFunc._cachedScopeObject,
        //         depth = -1,
        //         path = ''
        //     while (scopeObject && scopeObject != Global) {
        //         depth++;
        //         scopeObject = scopeObject[2]; // descend in scope
        //     }
        //     scopeObject = this.originalFunc._cachedScopeObject;
        //     var path = 'this.originalFunc._cachedScopeObject';
        //     for (var i = depth; i >= 0; i--) {
        //         closureVars.push('_' + depth + '=' + path + '[1]');
        //         closureVars.push('__' + depth + '=' + path);
        //         path += '[2]';
        //     }
        // }
        var src = closureVars.length > 0 ? 'var ' + closureVars.join(',') + ';\n' : '';
        if (specificSuperHandling) src += '(function superWrapperForClosure() { return ';
        src += '(' + funcSource + ')';
        if (specificSuperHandling) src += '.apply(this, [$super.bind(this)].concat(Array.from(arguments))) })';
        if (lively.Config.get('loadRewrittenCode')) {
            module('lively.ast.Rewriting').load(true);
            var namespace = '[runtime]';
            if (optFunc && optFunc.sourceModule)
                namespace = new URL(optFunc.sourceModule.findUri()).relativePathFrom(URL.root);
            var fnAst = lively.ast.acorn.parse(src),
                rewrittenAst = lively.ast.Rewriting.rewrite(fnAst, lively.ast.Rewriting.getCurrentASTRegistry(), namespace),
                retVal = rewrittenAst.body[0].block.body.last();

            // FIXME: replace last ExpressionStatement with ReturnStatement
            retVal.type = 'ReturnStatement';
            retVal.argument = retVal.expression;
            delete retVal.expression;

            src = '(function() { ' + escodegen.generate(rewrittenAst) + '}).bind(this)();';
        }

        try {
            var func = eval(src) || this.couldNotCreateFunc(src);
            this.addFuncProperties(func);
            this.originalFunc = func;
            if (lively.Config.get('loadRewrittenCode')) {
                func._cachedAst.source = funcSource;
                // FIXME: adjust start and end of FunctionExpression (because of brackets)
                func._cachedAst.start++;
                func._cachedAst.end--;
            }
            return func;
        } catch (e) {
            alert('Cannot create function ' + e + ' src: ' + src);
            throw e;
        }
    },

    addFuncProperties: function(func) {
        var props = this.getFuncProperties();
        for (var name in props) {
            if (props.hasOwnProperty(name)) func[name] = props[name];
        }
        this.addClosureInformation(func);
    },

    couldNotCreateFunc: function(src) {
        var msg = 'Could not recreate closure from source: \n' + src;
        console.error(msg);
        alert(msg);
        return function() { alert(msg) };
    }
},
'conversion', {
    asFunction: function() {
        return this.recreateFunc()
    }
},
'function modification',{
    addClosureInformation: function(f) {
        f.hasLivelyClosure = true;
        f.livelyClosure = this;
        return f;
    }
});

Object.extend(lively.Closure, {
    fromFunction: function(func, varMapping) {
        return new this(func, varMapping || {});
    },

    fromSource: function(source, varMapping) {
        return new this(null, varMapping || {}, source);
    }
});

}); // end of module
