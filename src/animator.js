'use strict';

const duration = 320;

function css(element, styles) {
    for(let property in styles) {
        if (!styles.hasOwnProperty(property)) {
            continue;
        }

        element.style[property] = styles[property];
    }
}

function initObjectProperties(properties, value) {
    const newObject = {};
    for(let i=0; i<properties.length; i++) {
        newObject[properties[i]] = value;
    }
    return newObject;
}

function copyObjectProperties(properties, object) {
    const newObject = {};
    for(let i=0; i<properties.length; i++) {
        newObject[properties[i]] = object[properties[i]];
    }
    return newObject;
}

/**
 * Checks if the given element is currently being animated.
 *
 * @param element
 * @returns {boolean}
 */
function animated(element) {
    return !! element.getAttribute('data-animated');
}

/**
 * Toggles the element using the given animation.
 *
 * @param element
 * @param animation Either "fade" or "slide"
 * @param callbackFn
 */
function toggle(element, animation, callbackFn) {
    const nowVisible = element.style.display !== 'none' || element.offsetLeft > 0;

    // create clone for reference
    const clone = element.cloneNode(true);
    const cleanup = function() {
        element.removeAttribute('data-animated');
        element.setAttribute('style', clone.getAttribute('style'));
        element.style.display = nowVisible ? 'none' : '';
		if( callbackFn ) { callbackFn(); }
    };

    // store attribute so everyone knows we're animating this element
    element.setAttribute('data-animated', "true");

    // toggle element visiblity right away if we're making something visible
    if( ! nowVisible ) {
        element.style.display = '';
    }

    let hiddenStyles;
    let visibleStyles;

    // animate properties
    if ( animation === 'slide' ) {
        hiddenStyles = initObjectProperties(["height", "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"], 0);
        visibleStyles = {};

        if( ! nowVisible ) {
            const computedStyles = window.getComputedStyle(element);
            visibleStyles = copyObjectProperties(["height", "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"], computedStyles);

            // in some browsers, getComputedStyle returns "auto" value. this falls back to getBoundingClientRect() in those browsers since we need an actual height.
            if(!isFinite(visibleStyles.height)) {
              const clientRect = element.getBoundingClientRect();
              visibleStyles.height = clientRect.height;
            }

            css(element, hiddenStyles);
        }

        // don't show a scrollbar during animation
        element.style.overflowY = 'hidden';
        animate(element, nowVisible ? hiddenStyles : visibleStyles, cleanup);
    } else {
        hiddenStyles = { opacity: 0 };
        visibleStyles = { opacity: 1 };
        if( ! nowVisible ) {
            css(element, hiddenStyles);
        }

        animate(element, nowVisible ? hiddenStyles : visibleStyles, cleanup);
    }
}

function animate(element, targetStyles, fn) {
    let last = +new Date();
    let initialStyles = window.getComputedStyle(element);
    let currentStyles = {};
    let propSteps = {};

    for (let property in targetStyles) {
        if (!targetStyles.hasOwnProperty(property)) {
            continue;
        }

        // make sure we have an object filled with floats
        targetStyles[property] = parseFloat(targetStyles[property]);

        // calculate step size & current value
        const to = targetStyles[property];
        const current = parseFloat(initialStyles[property]);

        // is there something to do?
        if ( current == to ) {
            delete targetStyles[property];
            continue;
        }

        propSteps[property] = ( to - current ) / duration; // points per second
        currentStyles[property] = current;
    }

    const tick = function() {
        const now = +new Date();
        const timeSinceLastTick = now - last;
        let done = true;

        let step, to, increment, newValue;
        for(let property in targetStyles ) {
            if (!targetStyles.hasOwnProperty(property)) {
                continue;
            }

            step = propSteps[property];
            to = targetStyles[property];
            increment =  step * timeSinceLastTick;
            newValue = currentStyles[property] + increment;

            if( step > 0 && newValue >= to || step < 0 && newValue <= to ) {
                newValue = to;
            } else {
                done = false;
            }

            // store new value
            currentStyles[property] = newValue;

            const suffix = property !== "opacity" ? "px" : "";
            element.style[property] = newValue + suffix;
        }

        last = +new Date();

        // keep going until we're done for all props
        if(!done) {
            (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 32);
        } else {
            // call callback
            fn && fn();
        }
    };

    tick();
}

module.exports = {
    'toggle': toggle,
    'animate': animate,
    'animated': animated
};
