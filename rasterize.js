/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
//const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
const INPUT_TRIANGLES_URL = "https://pages.github.ncsu.edu/zdraboin/Berzerk/level1Walls.json"; // triangles file loc
//const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/spheres.json"; // spheres file loc
//const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog4/triangles.json"; // triangles file loc
var eye = new vec3.fromValues(0.5, 0.5, -0.5); // default eye position in world space
var lookAt = new vec3.fromValues(0.5, 0.5, 0.5); // look at vector
var lookUp = new vec3.fromValues(0, 1, 0); // lookup vector
var perspective = true; //toggle between perspective and parallel projections

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer = []; // this contains vertex coordinates in triples
var triangleBuffer = []; // this contains indices into vertexBuffer in triples
var colorDiffuseBuffer = []; // this contains some color stuff
var colorAmbientBuffer = []; //contains the ambient color
var colorSpecularBuffer = []; //contains the specular color
//var colorAlphaBuffer = [];// contains the alpha
var normalBuffer = []; //this contains the normals
var triBufferSize = []; // the number of indices in the triangle buffer
var uvBuffers = [];
var imgBuffers = [];
var toLightOrNotToLight = false;
var lightMapBool = false;

var selectedIndex = -1; // the index of the selected triangle
var selectedScale = 1.2; // the scale of the selected triangle

var textureULoc;
var textureULocLM;
var texcoordLoc; // where to put texture for vertex shader to pass to the fragment shader

var imgBufferLM;



var vertexPositionAttrib; // where to put position for vertex shader
var vertexNormalAttrib; // normals for vertex shader
var vertexDiffuseColorUniform; // colors for the shader
var vertexAmbientColorUniform; // colors for the shader
var vertexSpecularColorUniform; // colors for the shader
var lightingBooleanLocation;
var lightingMapBooleanLocation;

var lightWorldPositionLocation;
var eyeWorldPositionLocation;
var nValueLocation;
var alphaValueLocation;

var inputTriangles; //global variable for JSON triangles

var lightPos = vec3.fromValues(-1, 2, -1); //the position of the light

var lightmap;
var lightmapisLoaded = false;


// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url, descr) {
    try {
        if ((typeof (url) !== "string") || (typeof (descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET", url, false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now() - startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open " + descr + " file!";
            else
                return JSON.parse(httpReq.response);
        } // end if good params
    } // end try    

    catch (e) {
        console.log(e);
        return (String.null);
    }
} // end get input spheres

function myKeyPressHandler(event) {
    var viewDir = mat3.create();
    var yaw = mat3.create();
    var pitch = mat3.create();
    vec3.normalize(viewDir, vec3.subtract(viewDir, lookAt, eye));
    vec3.normalize(yaw, vec3.cross(yaw, lookUp, viewDir));
    console.log(event.which);

    function translateSelect(dir) {
        if (selectedIndex != -1) {
            vec3.add(inputTriangles[selectedIndex].translateBy, inputTriangles[selectedIndex].translateBy, dir);
            //vec3.add(inputTriangles[selectedIndex].centroid, inputTriangles[selectedIndex].centroid, dir);
        }


    }

    function rotateSelect(radians, dir) {
        if (selectedIndex != -1) {

            //mat4.multiply(inputTriangles[selectedIndex].rotateBy, mat4.fromTranslation(mat4.create(), vec3.negate(vec3.create(), inputTriangles[selectedIndex].centroid)), inputTriangles[selectedIndex].rotateBy); // translate to origin
            mat4.multiply(inputTriangles[selectedIndex].rotateBy,
                mat4.fromRotation(mat4.create(), radians, dir),
                inputTriangles[selectedIndex].rotateBy); // rotate 10 degs
            //mat4.multiply(inputTriangles[selectedIndex].rotateBy, mat4.fromTranslation(mat4.create(), inputTriangles[selectedIndex].centroid), inputTriangles[selectedIndex].rotateBy);
        }


    }

    //To implement these changes you will need to change the eye, lookAt and lookUp vectors used to form your viewing transform.
    switch (event.which) {
        ////******************************************************************************************************
        ///Part 6
        case (98):
            toLightOrNotToLight = true;
            lightMapBool = false;
            break;
        case (109):
            lightMapBool = true;
            toLightOrNotToLight = false;
            break;
        case (117):
            toLightOrNotToLight = false;
            lightMapBool = false;
            break;
        case (107): //k
            translateSelect(vec3.scale(yaw, yaw, 0.1));
            break;
        case (59): //;
            translateSelect(vec3.scale(yaw, yaw, -0.1));
            break;
        case (111): //o
            translateSelect(vec3.scale(viewDir, viewDir, 0.1));
            break;
        case (108): //l
            translateSelect(vec3.scale(viewDir, viewDir, -0.1));
            break;
        case (105): //i
            translateSelect(vec3.scale(pitch, lookUp, 0.1));
            break;
        case (112): //p
            translateSelect(vec3.scale(pitch, lookUp, -0.1));
            break;
        case (75): //K
            rotateSelect(Math.PI / -36, lookUp);
            break;
        case (58): //:
            rotateSelect(Math.PI / 36, lookUp);
            break;
        case (79): //O
            rotateSelect(Math.PI / 36, yaw);
            break;
        case (76): //L
            rotateSelect(Math.PI / -36, yaw);
            break;
        case (73): //I
            rotateSelect(Math.PI / -36, viewDir);
            break;
        case (80): //P
            rotateSelect(Math.PI / 36, viewDir);
            break;





        //*****************************************************************************************************

        case (97): //a
            vec4.add(eye, eye, vec3.scale(yaw, yaw, 0.1));
            vec4.add(lookAt, lookAt, yaw);
            break;
        case (100): //d
            vec4.add(eye, eye, vec3.scale(yaw, yaw, -0.1));
            vec4.add(lookAt, lookAt, yaw);
            break;
        case (115): //s
            vec4.add(eye, eye, vec3.scale(viewDir, viewDir, -0.1));
            vec4.add(lookAt, lookAt, viewDir);
            break;
        case (119): //w
            vec4.add(eye, eye, vec3.scale(viewDir, viewDir, 0.1));
            vec4.add(lookAt, lookAt, viewDir);
            break;
        case (113): //q up
            vec4.add(eye, eye, vec3.scale(pitch, lookUp, 0.1));
            vec4.add(lookAt, lookAt, pitch);
            break;
        case (101): //e down
            vec4.add(eye, eye, vec3.scale(pitch, lookUp, -0.1));
            vec4.add(lookAt, lookAt, pitch);
            break;
        case (90): //Z
            var newWidth = prompt("Enter New Width");
            var newHeight = prompt("Enter New Height");
            var canvas = document.getElementById("myWebGLCanvas");
            canvas.width = parseInt(newWidth);
            gl.viewportWidth = parseInt(newWidth);
            canvas.height = parseInt(newHeight);
            gl.viewportHeight = parseInt(newHeight);
            break;
        case (65): //A
            vec4.add(lookAt, lookAt, vec3.scale(yaw, yaw, 0.1));
            break;
        case (68): //D
            vec4.add(lookAt, lookAt, vec3.scale(yaw, yaw, -0.1));
            break;
        case (83): //S
            vec4.add(lookAt, lookAt, vec3.scale(pitch, lookUp, 0.1));
            vec3.normalize(lookUp, vec3.cross(lookUp, viewDir, yaw));
            break;
        case (87): //W
            vec4.add(lookAt, lookAt, vec3.scale(pitch, lookUp, -0.1));
            vec3.normalize(lookUp, vec3.cross(lookUp, viewDir, yaw));
            break;
        case (60): // < perspective projection
            perspective = true;
            break;
        case (61): // = parallel projection
            perspective = false;
            break;
    }
}

function selectTriangle(forwardBool) {
    if (selectedIndex == -1) {
        if (forwardBool) {
            inputTriangles[0].selected = true;
            selectedIndex = 0;
        }
        else {
            inputTriangles[inputTriangles.length - 1].selected = true;
            selectedIndex = inputTriangles.length - 1;
        }
    }
    else {
        inputTriangles[selectedIndex].selected = false;
        if (forwardBool) {
            selectedIndex = (selectedIndex + 1) % inputTriangles.length;
            inputTriangles[selectedIndex].selected = true;
        }
        else {
            selectedIndex -= 1;
            if (selectedIndex < 0) selectedIndex = inputTriangles.length - 1;
            inputTriangles[selectedIndex].selected = true;
        }
    }

}

function deselectTriangles() {
    inputTriangles[selectedIndex].selected = false;
    selectedIndex = -1;
}


function myKeyDownHandler(event) {
    //console.log(event.which);
    switch (event.which) {
        case (37): //left
            selectTriangle(false);
            break;
        case (39): //right
            selectTriangle(true);
            break;
        case (32): // space
            deselectTriangles();
            break;
    }

}


// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it

    //enable onkey press for user input
    document.onkeypress = myKeyPressHandler;
    document.onkeydown = myKeyDownHandler;

    // Get the image canvas, render an image in it
    var imageCanvas = document.getElementById("myImageCanvas"); // create a 2d canvas
    var cw = imageCanvas.width, ch = imageCanvas.height;
    imageContext = imageCanvas.getContext("2d");
    var bkgdImage = new Image();
    bkgdImage.crossOrigin = "Anonymous";
    bkgdImage.src = "https://ncsucgclass.github.io/prog4/sky.jpg";
    bkgdImage.onload = function () {
        var iw = bkgdImage.width, ih = bkgdImage.height;
        imageContext.drawImage(bkgdImage, 0, 0, iw, ih, 0, 0, cw, ch);
    } // end onload callback

    try {
        if (gl == null) {
            throw "unable to create gl context -- is your browser gl ready?";
        } else {
            //gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer

            gl.clearDepth(1.0); // use max when we clear the depth buffer
            gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
            //gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            //gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);

            //Ensure webgl viewport matched canvas dims
            //canvas.width = 400;
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;

        }
    } // end try

    catch (e) {
        console.log(e);
    } // end catch

} // end setupWebGL

// read triangles in, load them into webgl buffers
// read triangles in, load them into webgl buffers
function loadTriangles() {

    imgBufferLM = gl.createTexture();
    lightmap = new Image();
    lightmap.crossOrigin = "Anonymous";
    lightmap.onload =
        function loaded() {
            lightmapisLoaded = true;
        }

    lightmap.src = "https://ncsucgclass.github.io/prog4/lightmap.gif";

    inputTriangles = getJSONFile(INPUT_TRIANGLES_URL, "triangles");
    if (inputTriangles != String.null) {
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var uvsToAdd; //uv values to add to the uv array

        for (var whichSet = 0; whichSet < inputTriangles.length; whichSet++) {
            var coordArray = []; // 1D array of vertex coords for WebGL
            var colorDiffuseArray = []; // 1D array of diffuse vertex colors for WebGL
            var colorAmbientArray = []; // 1D array of diffuse vertex colors for WebGL
            var colorSpecularArray = []; // 1D array of specular vertex colors for WebGL
            var indexArray = []; // 1D array of triangle indices for WebGL
            var normalArray = []; // 1d array of vertex normals of webGL
            var indices; // reference to current triangle
            var indexNormal;


            inputTriangles[whichSet].selected = false; //indicate that nothing is selected
            inputTriangles[whichSet].centroid = vec3.fromValues(0, 0, 0); //initialize a coordinate array for the triangle set to find the centroid
            inputTriangles[whichSet].translateBy = vec3.fromValues(0, 0, 0); //initialize a translate vector
            inputTriangles[whichSet].rotateBy = mat4.create(); //initialize rotate vector


            inputTriangles[whichSet].glNormals = []; // flat normal list for webgl
            inputTriangles[whichSet].glUVs = [];
            // set up the vertex coord and color array
            for (whichSetVert = 0; whichSetVert < inputTriangles[whichSet].vertices.length; whichSetVert++) {
                indexNormal = inputTriangles[whichSet].normals[whichSetVert]; // get normal to add
                coordArray = coordArray.concat(inputTriangles[whichSet].vertices[whichSetVert]);
                //inputTriangles[whichSet].glNormals.push(normToAdd[0], normToAdd[1], normToAdd[2]); // put normal in set coord list
                uvsToAdd = inputTriangles[whichSet].uvs[whichSetVert];
                inputTriangles[whichSet].glUVs.push(uvsToAdd[0], uvsToAdd[1]); // put uvs in uv list
                normalArray.push(indexNormal[0], indexNormal[1], indexNormal[2]);
                colorDiffuseArray = colorDiffuseArray.concat(inputTriangles[whichSet].material.diffuse);
                colorAmbientArray = colorAmbientArray.concat(inputTriangles[whichSet].material.ambient);
                colorSpecularArray = colorSpecularArray.concat(inputTriangles[whichSet].material.specular);
                vec3.add(inputTriangles[whichSet].centroid, inputTriangles[whichSet].centroid, inputTriangles[whichSet].vertices[whichSetVert]);
            }
            vec3.scale(inputTriangles[whichSet].centroid, inputTriangles[whichSet].centroid, 1 / inputTriangles[whichSet].vertices.length);

            // set up the triangle index array
            for (whichSetTri = 0; whichSetTri < inputTriangles[whichSet].triangles.length; whichSetTri++) {
                indices = inputTriangles[whichSet].triangles[whichSetTri];
                indexArray.push(indices[0], indices[1], indices[2]);
            }



            // send the vertex coords to webGL
            vertexBuffer.push(gl.createBuffer()); // init empty vertex coord buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer[whichSet]); // activate that buffer
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordArray), gl.STATIC_DRAW); // coords to that buffer

            //------------------------------------------------------------------------
            //------------------------------------------------------------------------
            uvBuffers[whichSet] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffers[whichSet]); // activate that buffer
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inputTriangles[whichSet].glUVs), gl.STATIC_DRAW); // data in

            inputTriangles[whichSet].imgBuffer = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, inputTriangles[whichSet].imgBuffer);
            // Fill the texture with a 1x1 blue pixel.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([255, 255, 255, 255]));
            // Asynchronously load an image
            inputTriangles[whichSet].isLoaded = false;
            inputTriangles[whichSet].image = new Image();
            inputTriangles[whichSet].image.crossOrigin = "Anonymous";
            inputTriangles[whichSet].image.alt = whichSet;
            inputTriangles[whichSet].image.onload =
                function loaded() {
                    inputTriangles[this.alt].isLoaded = true;
                    //requestAnimationFrame(renderModels);
                }

            inputTriangles[whichSet].image.src = "https://pages.github.ncsu.edu/zdraboin/Berzerk/" + inputTriangles[whichSet].material.texture;

                //------------------------------------------------------------------------
                //------------------------------------------------------------------------

            // send the normals to webGL
            normalBuffer[whichSet] = gl.createBuffer(); // init empty vertex normal buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer[whichSet]); // activate that buffer
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalArray), gl.STATIC_DRAW); // normals to that buffer

            colorDiffuseBuffer.push(gl.createBuffer()); // init empty vertex color buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, colorDiffuseBuffer[whichSet]); // activate that buffer
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorDiffuseArray), gl.STATIC_DRAW); // colors to that buffer

            colorAmbientBuffer.push(gl.createBuffer()); // init empty vertex color buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, colorAmbientBuffer[whichSet]); // activate that buffer
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorAmbientArray), gl.STATIC_DRAW); // colors to that buffer

            colorSpecularBuffer.push(gl.createBuffer()); // init empty vertex color buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, colorSpecularBuffer[whichSet]); // activate that buffer
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorSpecularArray), gl.STATIC_DRAW); // colors to that buffer



            triangleBuffer.push(gl.createBuffer()); // init empty triangle buffer
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer[whichSet]); // activate that buffer
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW); // indices to that buffer
            triBufferSize.push(indexArray.length);

        } // end for each triangle set 







    } // end if triangles found
} // end load triangles

// setup the webGL shaders
function setupShaders() {

    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float;
        vec3 fLighting;
        
        uniform vec3 vertexDiffuseColor;
        uniform vec3 vertexAmbientColor;
        uniform vec3 vertexSpecularColor;
        uniform float nValue;
        uniform float alphaValue;

        uniform bool lightBoolean;
        uniform bool lightMapBoolean;

        varying vec3 vNormal;
        varying vec3 vSurfaceToLight;
        varying vec3 vSurfaceToView;

        // Passed in from the vertex shader.
        varying vec2 v_texcoord;

        // The texture.
        uniform sampler2D u_texture;
        uniform sampler2D u_textureLM;


        void main(void) {
            vec3 normal = normalize(vNormal);
            vec3 light = normalize(vSurfaceToLight);
            vec3 view = normalize(vSurfaceToView);
            vec3 halfVector = normalize(view + light);
            float nDotL = max(dot(normal, light), 0.0);
            float nDotH = max(dot(normal, halfVector), 0.0);
            float specularIntensity = pow(nDotH, nValue);

            //fLighting = vertexAmbientColor + vertexDiffuseColor * nDotL;
            if (lightBoolean) fLighting = vertexAmbientColor + vertexDiffuseColor * nDotL + vertexSpecularColor * specularIntensity ;//
            else fLighting = vec3(1, 1, 1);
            if (!lightMapBoolean) gl_FragColor = vec4(fLighting, 1.0) * texture2D(u_texture, v_texcoord * vec2(-1.0, -1.0)) * alphaValue;
            else gl_FragColor = vec4(fLighting, 1.0) * texture2D(u_texture, v_texcoord * vec2(-1.0, -1.0)) * texture2D(u_textureLM, v_texcoord * vec2(-1.0, -1.0)) * alphaValue;
            
        }
    `;

    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 vertexPosition;
        attribute vec3 aNormal;

        //-------------------------------------------------
        attribute vec2 a_texcoord; // We need to pass in texture coordinates.
        varying vec2 v_texcoord; // Then pass them to the fragment shader!!!!!!!!!
        //-------------------------------------------------

        uniform vec3 lightWorldPosition;
        uniform vec3 eyeWorldPosition;

        uniform mat4 uModel;
        uniform mat4 uModelView;
        uniform mat4 uProjection;
        uniform mat4 modelInvertTranspose;

        varying vec3 vNormal;
        varying vec3 vSurfaceToLight;
        varying vec3 vSurfaceToView;
        
        void main(void) {
            gl_Position = uProjection * uModelView * vec4(vertexPosition, 1.0); 
            vNormal = (modelInvertTranspose * vec4(aNormal, 0.0)).xyz;
            vec3 surfaceWorldPosition = (uModel * vec4(vertexPosition, 1.0)).xyz;
            vSurfaceToLight = lightWorldPosition - surfaceWorldPosition;
            vSurfaceToView = eyeWorldPosition - surfaceWorldPosition;


            //-------------------------------------------------
            // Pass the texcoord to the fragment shader.
            v_texcoord = a_texcoord;
            //-------------------------------------------------

        }
    `;

    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader, fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader, vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution

        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                vertexPositionAttrib = // get pointer to vertex shader input
                    gl.getAttribLocation(shaderProgram, "vertexPosition");
                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array

                texcoordLoc = gl.getAttribLocation(shaderProgram, "a_texcoord");
                gl.enableVertexAttribArray(texcoordLoc);

                vertexNormalAttrib = // get pointer to vertex shader input
                    gl.getAttribLocation(shaderProgram, "aNormal");
                gl.enableVertexAttribArray(vertexNormalAttrib); // input to shader from array

                vertexDiffuseColorUniform = gl.getUniformLocation(shaderProgram, "vertexDiffuseColor");
                vertexAmbientColorUniform = gl.getUniformLocation(shaderProgram, "vertexAmbientColor");
                vertexSpecularColorUniform = gl.getUniformLocation(shaderProgram, "vertexSpecularColor");

                textureULoc = gl.getUniformLocation(shaderProgram, "u_texture");
                gl.uniform1i(textureULoc, 0);  // texture unit 1
                textureULocLM = gl.getUniformLocation(shaderProgram, "u_textureLM"); //for lightmap
                gl.uniform1i(textureULocLM, 1);  // texture unit 1

                lightWorldPositionLocation = gl.getUniformLocation(shaderProgram, "lightWorldPosition");
                eyeWorldPositionLocation = gl.getUniformLocation(shaderProgram, "eyeWorldPosition");
                nValueLocation = gl.getUniformLocation(shaderProgram, "nValue");
                alphaValueLocation = gl.getUniformLocation(shaderProgram, "alphaValue");
                lightingBooleanLocation = gl.getUniformLocation(shaderProgram, "lightBoolean");
                lightingMapBooleanLocation = gl.getUniformLocation(shaderProgram, "lightMapBoolean");

                modelMatrixUniform = gl.getUniformLocation(shaderProgram, "uModel");
                modelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "uModelView");
                projectionMatrixUniform = gl.getUniformLocation(shaderProgram, "uProjection");
                modelInvertTransposeMatrixUniform = gl.getUniformLocation(shaderProgram, "modelInvertTranspose");

            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 

    catch (e) {
        console.log(e);
    } // end catch

} // end setup shaders


var bgColor = 0;
// render the loaded model
function renderTriangles() {
    //projection
    var projection = mat4.create();
    //view
    var view = mat4.create();
    //model

    //model view
    var modelview = mat4.create();
    //field of view angle in radians
    var fov = 0.5 * Math.PI;


    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    //bgColor = 0;
    //gl.clearColor(bgColor, 0, 0, 1.0);
    requestAnimationFrame(renderTriangles);

    if (perspective) mat4.perspective(projection, fov, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
    else mat4.ortho(projection, -1, 1, -1, 1, 0.1, 100.0);

    mat4.lookAt(view, eye, lookAt, lookUp);


    for (var whichSet = 0; whichSet < inputTriangles.length; whichSet++) {
        var model = mat4.create();
        var modelInvertTranspose = mat4.create();
        mat4.identity(model);
        mat4.identity(modelview);
        mat4.multiply(modelview, modelview, view);


        //mat4.fromTranslation(inputTriangles[0].mMatrix,vec3.negate(vec3.create(),setCenter)); // translate to origin
        mat4.fromTranslation(model, vec3.negate(vec3.create(), inputTriangles[whichSet].centroid));// translate to origin
        //vec3.multiply(model, model, vec3.negate(revCentroid, inputTriangles[whichSet].centroid)); //translate to center
        //mat4.multiply(model, mat4.fromRotation(mat4.create(), Math.PI / 2, vec3.fromValues(0, 0, 1)), model); // rotate 90 degs
        if (inputTriangles[whichSet].selected) mat4.multiply(model, mat4.fromScaling(mat4.create(), vec3.fromValues(1.2, 1.2, 1.2)), model); //scale
        mat4.multiply(model, inputTriangles[whichSet].rotateBy, model); //rotate
        mat4.multiply(model, mat4.fromTranslation(mat4.create(), inputTriangles[whichSet].centroid), model); //translate back

        mat4.multiply(model, mat4.fromTranslation(mat4.create(), inputTriangles[whichSet].translateBy), model);

        mat4.multiply(modelview, modelview, model);

        mat4.invert(modelInvertTranspose, modelview);
        mat4.transpose(modelInvertTranspose, modelInvertTranspose); //https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Lighting_in_WebGL

        // vertex buffer: activate and feed into vertex shader
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer[whichSet]); // activate
        gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0); // feed

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTriangles[whichSet].imgBuffer);
        // Fill the texture with a 1x1 blue pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([255, 255, 255, 255]));


        if (inputTriangles[whichSet].isLoaded) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, inputTriangles[whichSet].imgBuffer);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, inputTriangles[whichSet].image);
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.bindTexture(gl.TEXTURE_2D, inputTriangles[whichSet].imgBuffer);
            // Fill the texture with a 1x1 blue pixel.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([255, 255, 255, 255]));
        }
        


        if (lightmapisLoaded) {
            
            // Make the "texture unit" 0 be the active texture unit.
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, imgBufferLM);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lightmap);
            gl.generateMipmap(gl.TEXTURE_2D);
        }
        

        // We'll supply texcoords as floats.
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffers[whichSet]); // activate
        gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0);

        // normal buffer: activate and feed into normal
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer[whichSet]); // activate
        gl.vertexAttribPointer(vertexNormalAttrib, 3, gl.FLOAT, false, 0, 0); // feed

        // triangle buffer: activate and render
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer[whichSet]); // activate

        gl.uniform3fv(vertexDiffuseColorUniform, inputTriangles[whichSet].material.diffuse);
        gl.uniform3fv(vertexAmbientColorUniform, inputTriangles[whichSet].material.ambient);
        gl.uniform3fv(vertexSpecularColorUniform, inputTriangles[whichSet].material.specular);
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        gl.uniform1f(nValueLocation, inputTriangles[whichSet].material.n);
        gl.uniform1f(alphaValueLocation, inputTriangles[whichSet].material.alpha);
        gl.depthMask(true);
        if (inputTriangles[whichSet].material.alpha != 1) {
            gl.depthMask(false);
        }
        //lightingBooleanLocation
        gl.uniform1i(lightingBooleanLocation, toLightOrNotToLight);
        gl.uniform1i(lightingMapBooleanLocation, lightMapBool);
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        gl.uniform3fv(lightWorldPositionLocation, lightPos);
        gl.uniform3fv(eyeWorldPositionLocation, eye);

        gl.uniformMatrix4fv(projectionMatrixUniform, false, projection);
        gl.uniformMatrix4fv(modelMatrixUniform, false, model);
        gl.uniformMatrix4fv(modelViewMatrixUniform, false, modelview);
        gl.uniformMatrix4fv(modelInvertTransposeMatrixUniform, false, inputTriangles[whichSet].rotateBy);

        //gl.drawArrays(gl.TRIANGLES,0,3); // render
        gl.drawElements(gl.TRIANGLES, triBufferSize[whichSet], gl.UNSIGNED_SHORT, 0); // render
    }
} // end render triangles


/* MAIN -- HERE is where execution begins after window load */

function main() {

    setupWebGL(); // set up the webGL environment
    loadTriangles(); // load in the triangles from tri file
    setupShaders(); // setup the webGL shaders
    renderTriangles(); // draw the triangles using webGL

} // end main
