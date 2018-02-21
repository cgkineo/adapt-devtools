define([
    "core/js/adapt"
], function(Adapt) {


    switch (Adapt.device.OS) {
        case "android":
        case "ios":
            break;
        default:
            return {
                containerFrame: null,
                evalInTop: function() {}
            };
    }

    function getContainerFrame() {
        var frames = $("iframe, frame", window.top.document);
        if (!frames.length) return;

        var containerFrame = null;
        for (var i = 0, l = frames.length; i < l; i++) {
            var frame = frames[i];
            if (window.location.href.substr(0, frame.src.length) !== frame.src) continue;
            containerFrame = frame;
            break;
        }

        return containerFrame;
    }

    function onChange(event) {

        var isInIframe = false;
        if (window.top.document === document) return outputNotInIFrame();

        var frame = getContainerFrame();
        if (!frame) return outputNotInIFrame();

        outputIFrameDimensions(event, frame);

    }

    function outputNotInIFrame() {
        console.log("Not in a frame");
    }

    function outputIFrameDimensions(event, frame) {
        if (event) {
            console.log("Frame event", event.type);
        }
        console.log("Frame outerHTML", frame.outerHTML);
        console.log("Frame size client", frame.clientWidth, "x", frame.clientHeight);
        console.log("Frame size css", frame.style.width, "x", frame.style.height);
    }


    $(window).on("orientationchange resize", onChange);
    $(onChange);

    window.evalInTop = function(code) {
        var frame = getContainerFrame();
        if (!frame) return;
        console.log(window.top.eval(code));
    }

    window.containerFrame = getContainerFrame();

    return {
        containerFrame: containerFrame,
        evalInTop: evalInTop
    };

});