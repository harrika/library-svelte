
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\Nav.svelte generated by Svelte v3.6.10 */

    const file = "src\\Nav.svelte";

    function create_fragment(ctx) {
    	var div1, div0, h3;

    	return {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "The Odin Library";
    			attr(h3, "class", "svelte-171dvxz");
    			add_location(h3, file, 2, 4, 66);
    			attr(div0, "class", "column column-30");
    			add_location(div0, file, 1, 3, 30);
    			attr(div1, "class", "navbar row svelte-171dvxz");
    			add_location(div1, file, 0, 1, 1);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div0, h3);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}
    		}
    	};
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment, safe_not_equal, []);
    	}
    }

    /* src\Book.svelte generated by Svelte v3.6.10 */

    const file$1 = "src\\Book.svelte";

    // (53:21) {:else}
    function create_else_block(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("not read");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (53:5) {#if read }
    function create_if_block(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("read");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var div1, div0, strong0, t0, t1, br, t2, strong1, t3, t4, t5, t6, t7, button0, t8, button1, div0_class_value, dispose;

    	function select_block_type(ctx) {
    		if (ctx.read) return create_if_block;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			strong0 = element("strong");
    			t0 = text(ctx.title);
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			strong1 = element("strong");
    			t3 = text(ctx.pages);
    			t4 = text(" pages");
    			t5 = space();
    			t6 = text(ctx.author);
    			t7 = space();
    			button0 = element("button");
    			if_block.c();
    			t8 = space();
    			button1 = element("button");
    			button1.textContent = "del";
    			add_location(strong0, file$1, 48, 5, 983);
    			add_location(br, file$1, 48, 30, 1008);
    			add_location(strong1, file$1, 49, 5, 1019);
    			attr(button0, "class", "button button-clear button-small svelte-1uk6quo");
    			add_location(button0, file$1, 51, 5, 1073);
    			attr(button1, "class", "button button-outline button-small svelte-1uk6quo");
    			add_location(button1, file$1, 54, 5, 1208);
    			attr(div0, "class", div0_class_value = "" + (ctx.read==true ? 'read': 'card') + " svelte-1uk6quo");
    			add_location(div0, file$1, 46, 4, 899);
    			attr(div1, "class", "column");
    			add_location(div1, file$1, 45, 3, 873);

    			dispose = [
    				listen(button0, "click", ctx.togstat),
    				listen(button1, "click", ctx.delbook)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div0, strong0);
    			append(strong0, t0);
    			append(div0, t1);
    			append(div0, br);
    			append(div0, t2);
    			append(div0, strong1);
    			append(strong1, t3);
    			append(strong1, t4);
    			append(div0, t5);
    			append(div0, t6);
    			append(div0, t7);
    			append(div0, button0);
    			if_block.m(button0, null);
    			append(div0, t8);
    			append(div0, button1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.title) {
    				set_data(t0, ctx.title);
    			}

    			if (changed.pages) {
    				set_data(t3, ctx.pages);
    			}

    			if (changed.author) {
    				set_data(t6, ctx.author);
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(button0, null);
    				}
    			}

    			if ((changed.read) && div0_class_value !== (div0_class_value = "" + (ctx.read==true ? 'read': 'card') + " svelte-1uk6quo")) {
    				attr(div0, "class", div0_class_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}

    			if_block.d();
    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

    	let { author, title, pages, read } = $$props;
    	const delbook =()=>dispatch("removebook", title);
    	const togstat =()=>dispatch("changeread", title);

    	const writable_props = ['author', 'title', 'pages', 'read'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Book> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('author' in $$props) $$invalidate('author', author = $$props.author);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('pages' in $$props) $$invalidate('pages', pages = $$props.pages);
    		if ('read' in $$props) $$invalidate('read', read = $$props.read);
    	};

    	return {
    		author,
    		title,
    		pages,
    		read,
    		delbook,
    		togstat
    	};
    }

    class Book extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment$1, safe_not_equal, ["author", "title", "pages", "read"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.author === undefined && !('author' in props)) {
    			console.warn("<Book> was created without expected prop 'author'");
    		}
    		if (ctx.title === undefined && !('title' in props)) {
    			console.warn("<Book> was created without expected prop 'title'");
    		}
    		if (ctx.pages === undefined && !('pages' in props)) {
    			console.warn("<Book> was created without expected prop 'pages'");
    		}
    		if (ctx.read === undefined && !('read' in props)) {
    			console.warn("<Book> was created without expected prop 'read'");
    		}
    	}

    	get author() {
    		throw new Error("<Book>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set author(value) {
    		throw new Error("<Book>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Book>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Book>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pages() {
    		throw new Error("<Book>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pages(value) {
    		throw new Error("<Book>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get read() {
    		throw new Error("<Book>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set read(value) {
    		throw new Error("<Book>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\AddBook.svelte generated by Svelte v3.6.10 */

    const file$2 = "src\\AddBook.svelte";

    function create_fragment$2(ctx) {
    	var div, form, fieldset, label, t1, input0, t2, input1, t3, input2, t4, input3, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			form = element("form");
    			fieldset = element("fieldset");
    			label = element("label");
    			label.textContent = "Add a book to the library";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			input1 = element("input");
    			t3 = space();
    			input2 = element("input");
    			t4 = space();
    			input3 = element("input");
    			add_location(label, file$2, 28, 8, 446);
    			attr(input0, "type", "text");
    			attr(input0, "placeholder", "Author");
    			attr(input0, "id", "authorField");
    			add_location(input0, file$2, 29, 8, 496);
    			attr(input1, "type", "text");
    			attr(input1, "placeholder", "Title");
    			attr(input1, "id", "titleField");
    			add_location(input1, file$2, 31, 8, 597);
    			attr(input2, "type", "number");
    			attr(input2, "placeholder", "Pages");
    			attr(input2, "id", "pageField");
    			add_location(input2, file$2, 33, 8, 695);
    			attr(input3, "class", "button-outline");
    			attr(input3, "type", "submit");
    			input3.value = "add";
    			add_location(input3, file$2, 36, 8, 804);
    			add_location(fieldset, file$2, 27, 5, 426);
    			add_location(form, file$2, 26, 4, 392);
    			attr(div, "class", "column");
    			add_location(div, file$2, 25, 3, 366);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(input2, "input", ctx.input2_input_handler),
    				listen(form, "submit", ctx.onSubmit)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, form);
    			append(form, fieldset);
    			append(fieldset, label);
    			append(fieldset, t1);
    			append(fieldset, input0);

    			input0.value = ctx.book.author;

    			append(fieldset, t2);
    			append(fieldset, input1);

    			input1.value = ctx.book.title;

    			append(fieldset, t3);
    			append(fieldset, input2);

    			input2.value = ctx.book.pages;

    			append(fieldset, t4);
    			append(fieldset, input3);
    		},

    		p: function update(changed, ctx) {
    			if (changed.book && (input0.value !== ctx.book.author)) input0.value = ctx.book.author;
    			if (changed.book && (input1.value !== ctx.book.title)) input1.value = ctx.book.title;
    			if (changed.book) input2.value = ctx.book.pages;
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let book = {
    		read:false,
    		author: "",
    		pages: 0,
    		title: ""
    	};
    	const onSubmit =(e)=> {
    		e.preventDefault();
    		dispatch("addbook", book);
    		$$invalidate('book', book = {
    			author: "",
    			pages: 0,
    			title: ""
    		});
    	};

    	function input0_input_handler() {
    		book.author = this.value;
    		$$invalidate('book', book);
    	}

    	function input1_input_handler() {
    		book.title = this.value;
    		$$invalidate('book', book);
    	}

    	function input2_input_handler() {
    		book.pages = to_number(this.value);
    		$$invalidate('book', book);
    	}

    	return {
    		book,
    		onSubmit,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	};
    }

    class AddBook extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, []);
    	}
    }

    /* src\App.svelte generated by Svelte v3.6.10 */

    const file$3 = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.book = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.book = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (105:28) {#if i%2 == 0 }
    function create_if_block_1(ctx) {
    	var current;

    	var book = new Book({
    		props: {
    		title: ctx.book.title,
    		pages: ctx.book.pages,
    		author: ctx.book.author,
    		read: ctx.book.read
    	},
    		$$inline: true
    	});
    	book.$on("removebook", ctx.removeBook);
    	book.$on("changeread", ctx.changeRead);

    	return {
    		c: function create() {
    			book.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(book, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var book_changes = {};
    			if (changed.books) book_changes.title = ctx.book.title;
    			if (changed.books) book_changes.pages = ctx.book.pages;
    			if (changed.books) book_changes.author = ctx.book.author;
    			if (changed.books) book_changes.read = ctx.book.read;
    			book.$set(book_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(book.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(book.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(book, detaching);
    		}
    	};
    }

    // (105:3) {#each books as book, i}
    function create_each_block_1(ctx) {
    	var if_block_anchor, current;

    	var if_block = (ctx.i%2 == 0) && create_if_block_1(ctx);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.i%2 == 0) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    // (117:28) {#if i%2 == 1 }
    function create_if_block$1(ctx) {
    	var current;

    	var book = new Book({
    		props: {
    		title: ctx.book.title,
    		pages: ctx.book.pages,
    		author: ctx.book.author,
    		read: ctx.book.read
    	},
    		$$inline: true
    	});
    	book.$on("removebook", ctx.removeBook);
    	book.$on("changeread", ctx.changeRead);

    	return {
    		c: function create() {
    			book.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(book, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var book_changes = {};
    			if (changed.books) book_changes.title = ctx.book.title;
    			if (changed.books) book_changes.pages = ctx.book.pages;
    			if (changed.books) book_changes.author = ctx.book.author;
    			if (changed.books) book_changes.read = ctx.book.read;
    			book.$set(book_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(book.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(book.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(book, detaching);
    		}
    	};
    }

    // (117:3) {#each books as book, i}
    function create_each_block(ctx) {
    	var if_block_anchor, current;

    	var if_block = (ctx.i%2 == 1) && create_if_block$1(ctx);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.i%2 == 1) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	var t0, div6, div2, div0, img, t1, div1, t2, div5, div3, t3, div4, current;

    	var navbar = new Nav({ $$inline: true });

    	var addbook = new AddBook({ $$inline: true });
    	addbook.$on("addbook", ctx.addBuk);

    	var each_value_1 = ctx.books;

    	var each_blocks_1 = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	var each_value = ctx.books;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create() {
    			navbar.$$.fragment.c();
    			t0 = space();
    			div6 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t1 = space();
    			div1 = element("div");
    			addbook.$$.fragment.c();
    			t2 = space();
    			div5 = element("div");
    			div3 = element("div");

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t3 = space();
    			div4 = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(img, "src", "lib.jpg");
    			attr(img, "alt", "libary");
    			attr(img, "class", "svelte-1mn7exp");
    			add_location(img, file$3, 96, 3, 1701);
    			attr(div0, "class", "column column-40 column-offset-10");
    			add_location(div0, file$3, 95, 2, 1650);
    			attr(div1, "class", "column column-40 column-offset-10");
    			add_location(div1, file$3, 98, 2, 1748);
    			attr(div2, "class", "row bm svelte-1mn7exp");
    			add_location(div2, file$3, 94, 1, 1627);
    			attr(div3, "class", "column");
    			add_location(div3, file$3, 103, 2, 1871);
    			attr(div4, "class", "column");
    			add_location(div4, file$3, 115, 2, 2168);
    			attr(div5, "class", "row");
    			add_location(div5, file$3, 102, 1, 1851);
    			attr(div6, "class", "container");
    			add_location(div6, file$3, 93, 0, 1602);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(navbar, target, anchor);
    			insert(target, t0, anchor);
    			insert(target, div6, anchor);
    			append(div6, div2);
    			append(div2, div0);
    			append(div0, img);
    			append(div2, t1);
    			append(div2, div1);
    			mount_component(addbook, div1, null);
    			append(div6, t2);
    			append(div6, div5);
    			append(div5, div3);

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div3, null);
    			}

    			append(div5, t3);
    			append(div5, div4);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div4, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.books) {
    				each_value_1 = ctx.books;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(changed, child_ctx);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(div3, null);
    					}
    				}

    				group_outros();
    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) out(i);
    				check_outros();
    			}

    			if (changed.books) {
    				each_value = ctx.books;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div4, null);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) out_1(i);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);

    			transition_in(addbook.$$.fragment, local);

    			for (var i = 0; i < each_value_1.length; i += 1) transition_in(each_blocks_1[i]);

    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(addbook.$$.fragment, local);

    			each_blocks_1 = each_blocks_1.filter(Boolean);
    			for (let i = 0; i < each_blocks_1.length; i += 1) transition_out(each_blocks_1[i]);

    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(navbar, detaching);

    			if (detaching) {
    				detach(t0);
    				detach(div6);
    			}

    			destroy_component(addbook);

    			destroy_each(each_blocks_1, detaching);

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	

    	let books = [
    		{
    			read: false,
    			author: "andrew johnson",
    			pages: 100,
    			title: "the river within"
    		},
    		{
    			read: false,
    			author: "willes monroe",
    			pages: 100,
    			title: "out of the house"
    		},
    		{
    			read: true,
    			author: "gordom meyer",
    			pages: 100,
    			title: "gone with the flames"
    		},
    		{
    			read: true,
    			author: "harrika sveltsy",
    			pages: 100,
    			title: "eschatos brides"
    		},
    		{
    			read: true,
    			author: "andrews johnson",
    			pages: 100,
    			title: "no retreat no surrender"
    		},
    		{
    			read: false,
    			author: "willes monroet",
    			pages: 100,
    			title: "desing a neuro network"
    		},
    		{
    			read: false,
    			author: "gordomb meyert",
    			pages: 100,
    			title: "enter the dragon"
    		},
    		{
    			read: false,
    			author: "gordomd meyert",
    			pages: 100,
    			title: "wonderland abyss"
    		},
    		{
    			read: false,
    			author: "gordomj meyert",
    			pages: 100,
    			title: "the scarlet pimpernel"
    		}
    	];
    	const addBuk = e => {
    		const newbook = e.detail;
    		$$invalidate('books', books = [...books, newbook]);
    	};
    	const removeBook = e => {
    		if (confirm("Sure about this!")) {
    			$$invalidate('books', books = books.filter(bk => bk.title !== e.detail));
    		}
    	};
    	const changeRead = e => {
    		const i = books.findIndex(buk => buk.title === e.detail);
    		books[i].read = !books[i].read; $$invalidate('books', books); 
    	};

    	return { books, addBuk, removeBook, changeRead };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
