// it is a constructor
var SimiliarityGraph = (function() {
    if (!d3) {
        console.error("Cannot find d3.js!");
    }
    if (!_) {
        console.error("Cannot find underscore.js!")
    }
    // it is a prototype of SimiliarityGraph
    var prototype = {
        validateConfig: function(config) {
            var selector = config.selector;
            var buckets = config.buckets;
            if (!selector || typeof selector !== "string") {
                return { isValid: false, msg: "Invalid Selector"};
            }
            if (!buckets || typeof buckets !== "object") {
                return { isValid: false, msg: "Invalid Selector"};
            }
            return {isValid: true}
        },
        getNodeData: function() {
            var nodeData = [];
            var buckets = this.buckets
            for (var i = 0; i < buckets.length; ++i) {
                nodeData.push({
                    name: buckets[i].name,
                    size: buckets[i].items.length
                })
            }
            return this.nodeData = nodeData;
        },
        getEdgeData: function() {
            var edgeData = [];
            var buckets = this.buckets;
            for (var i = 0; i < buckets.length; ++i) {
                for (var j = 0; j < i; ++j) {
                    var edge = {
                        source: i,
                        target: j,
                        union: _.union(buckets[i].items,buckets[j].items).length,
                        intersection: _.intersection(buckets[i].items,buckets[j].items).length
                    };
                    if(edge.intersection) {
                        edgeData.push(edge);
                    }
                }
            }
            this.edgeData = edgeData;
        },
        createSVG: function() {
            var selector = this.selector;
            var width = this.width;
            var height = this.height;
            var svg = d3
                .select(selector)
                .append("svg")
            if (width) {
                svg = svg.attr("width", width);
            }
            if (height) {
                svg = svg.attr("height", height);
            }
            return this.svg = svg;
        },
        setupForce: function() {
            var force = d3.layout
                .force()
                .charge( function(node){
                    // return -100;
                    return node.size * -15;
                }) // to be change
                .linkDistance(function(edge) {
                    var union = edge.union;
                    var inter = edge.intersection;
                    return 145*(union-inter)/union + 5;                    
                })
                .gravity(0.02)
                .size([this.width, this.height]);
            return this.force = force;
        },
        setupNodes: function() {
            var that = this;
            var nodeData = this.nodeData;
            var nodes = this.svg.selectAll(".node")
                .data(nodeData).enter()
                .append("circle")
                .attr("class", "node")
                .attr("r", function(node){ // ranodeius

                    return node.size > 5 ? node.size : 5;
                })
                .attr("show","yes")
                .style("fill", function(node) {
                    return that.color(node.size); 
                });
            return this.nodes = nodes;
        },
        setupEdges: function() {
            var edgeData = this.edgeData;
            var edges = this.svg.selectAll(".edge")
                .data(edgeData)
                .enter().append("line")
                .attr("class", "edge")
                .style("stroke", "#999999")
                .style("stroke-width", function(d) { 
                    return d.intersection; 
                })
            return this.edges = edges;
        },
        run: function() {
            var force = this.force;
            var nodeData = this.nodeData;
            var edgeData = this.edgeData;
            var edges = this.edges;
            var nodes = this.nodes;
            force
                .nodes(nodeData)
                .links(edgeData)
                .start();
            force.on("tick", function() {
                edges
                    .attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });
                // udpate node position
                nodes
                    .attr("transform", function(d) { 
                        return 'translate(' + [d.x, d.y] + ')'; 
                    });
                // udpate label position
                // labels
                //     .attr("transform", function(d) { 
                //         return 'translate(' + [10,-10] + ')'; 
                //     });
            });
        }
    }

    // Constructor
    return function(config) {
        var result = prototype.validateConfig(config)
        if (!result.isValid){
            console.error(result.msg);
            return instance;
        }   
        var instance = Object.create(prototype);
        // set up instance variable
        instance.buckets = config.buckets;
        instance.selector = config.selector;
        instance.width = config.width;
        instance.height = config.height;
        instance.color = config.color || d3.scale.category20();
        // set up instance method
        instance.setup = function() {
            this.getNodeData();
            this.getEdgeData();
            this.createSVG();
            this.setupEdges();
            this.setupNodes();
            this.setupForce();
            this.nodes.call(this.force.drag);
        }
        return instance;
    }
})();