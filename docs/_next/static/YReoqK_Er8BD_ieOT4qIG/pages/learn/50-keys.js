(window.webpackJsonp=window.webpackJsonp||[]).push([[11],{KWGP:function(e,n,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/learn/50-keys",function(){return t("j30e")}])},j30e:function(e,n,t){"use strict";t.r(n);var s=t("qNsG"),a=t("q1tI"),o=t.n(a),i=t("6qfE"),r=o.a.createElement;n.default=function(e){var n=e.components;Object(s.a)(e,["components"]);return r(i.MDXTag,{name:"wrapper",components:n},r(i.MDXTag,{name:"h1",components:n},"Data structures"),r(i.MDXTag,{name:"h2",components:n},"Graphs"),r(i.MDXTag,{name:"p",components:n},"Graphs are modeled as trees with symbolic links. Interior nodes are ",r(i.MDXTag,{name:"em",components:n,parentName:"p"},"functions")," mapping string keys to children, while leaf nodes are either values or links to other nodes in the tree. Every node also has a version (timestamp)."),r(i.MDXTag,{name:"p",components:n},"An interior node must return one of three values for every possible string: a child node, if one exists at that key; ",r(i.MDXTag,{name:"inlineCode",components:n,parentName:"p"},"null"),", if it is known that there is no such key, and ",r(i.MDXTag,{name:"inlineCode",components:n,parentName:"p"},"undefined")," if the existence of the key is not known. The last case occurs in graphs that represent cached data, query results, change sets etc."),r(i.MDXTag,{name:"p",components:n},"Graffy has only one simple pagination concept: A query may specify a subset of the keys of a node to retrieve."),r(i.MDXTag,{name:"p",components:n},'The keys of a node are always strings and sorted alphabetically. Queries may specify subsets using "ranges" composed of a start key, an end key and a signed integer count. A positive count N requests the first N non-null items between the start and end keys (inclusive), while a negative count -N requests the last N.'),r(i.MDXTag,{name:"p",components:n},"A segment is a valid Unicode string that does not contain the NUL character (\0)."),r(i.MDXTag,{name:"p",components:n},"Keys are composed of segments separated by NUL; in the normal case, a key just contains on segment, multi-segment keys are typically used in indexes."))}}},[["KWGP",1,0]]]);