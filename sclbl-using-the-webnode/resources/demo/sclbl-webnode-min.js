"use strict";let sclblRuntime=function(){let t={cf:null};t.settings={cfid:"",location:"local",strict:!1,inputType:"string",outputType:"string",debug:!1,memoryMin:2,memoryMax:16384},t.options=function(e){const n=Object.keys(t.settings);for(const r of n)r in e&&(t.settings[r]=e[r]);t.log("Settings set to:"+JSON.stringify(t.settings))},t.checkSettings=function(){if(!t.settings.cfid)throw new Error("No compute function ID found");if(".wasm"===t.settings.cfid.substring(t.settings.cfid.length-5)&&(t.settings.cfid=t.settings.cfid.slice(0,-5),t.log("Removed .wasm from cfid.")),!("location"in t.settings))throw new Error("location missing from settings.");if(!("strict"in t.settings))throw new Error("fallback missing from settings.");if(!("inputType"in t.settings))throw new Error("inputType missing from settings.");if(!("outputType"in t.settings))throw new Error("outputType missing from settings.");if(!("memoryMin"in t.settings))throw new Error("memoryMin missing from settings.");if(!("memoryMax"in t.settings))throw new Error("memoryMax missing from settings.")},t.convertLocalInput=function(t,e){let n,r;switch(e){case"string":t='{"input": '+t+"}",r=(new TextEncoder).encode(t),(n=new Int8Array(r.length+1)).set(r);break;case"numVec":t='{"input": ['+JSON.stringify(t)+"]}",r=(new TextEncoder).encode(t),(n=new Int8Array(r.length+1)).set(r);break;case"exact":r=(new TextEncoder).encode(t),(n=new Int8Array(r.length+1)).set(r);break;default:throw new Error("Unable to find the specified inputType / type not yet implemented.")}return n},t.convertRemoteInput=function(t,e){let n;switch(e){case"string":case"numVec":case"exact":n=t;break;default:throw new Error("Unable to find the specified inputType / type not yet implemented.")}return n},t.convertLocalOutput=function(t,e){let n,r;switch(e){case"string":n=(r=JSON.parse(t)).output.toString();break;case"numVec":n=(r=JSON.parse(t)).output;break;case"exact":case"raw":n=t;break;default:throw new Error("Unable to find or parse the specified output type.")}return n},t.convertRemoteOutput=function(t,e){let n,r,o;switch(e){case"string":r=JSON.parse(t),o=JSON.parse(r.result),n=JSON.parse(o.output).toString();break;case"numVec":r=JSON.parse(t),n=(o=JSON.parse(r.result)).output;break;case"exact":try{r=JSON.parse(t),n=JSON.parse(r.result)}catch(e){n=t}break;case"raw":n=t;break;default:throw new Error("Unable to find or parse the specified output type.")}return n},t.run=function(e){return new Promise(async function(n,r){try{t.checkSettings(),t.log("Settings ok: "+JSON.stringify(t.settings))}catch(e){return t.log("Error checking settings: "+e),r(e)}let o,i,s,c=t.settings.location;if("local"===t.settings.location){try{o=t.convertLocalInput(e,t.settings.inputType)}catch(t){return r(t)}try{i=await t.runLocal(o,t.settings.cfid)}catch(n){if(t.log("Failed to run task locally: "+n),t.settings.strict)return r(n);try{o=t.convertRemoteInput(e,t.settings.inputType),i=await t.runRemote(o,t.settings.cfid),c="remote"}catch(t){return r(t)}}}if("remote"===t.settings.location){try{o=await t.convertRemoteInput(e,t.settings.inputType),t.log("Input converted to: "+o)}catch(t){return r(t)}try{i=await t.runRemote(o,t.settings.cfid)}catch(t){return r(t)}}if("local"===c)s=t.convertLocalOutput(i,t.settings.outputType);else{if("remote"!==c)return r(new Error("Unable to parse task output."));s=t.convertRemoteOutput(i,t.settings.outputType)}t.log("Converted output: "+JSON.stringify(s)),n(s)})},t.runLocal=async function(n,r){let o,i;t.log("Trying to run task locally.");try{o=new e}catch(e){throw t.log("Unable to instantiate WASI polyfill: "+e),new Error("Unable to instantiate WASI polyfill")}try{await t.import(r,o)}catch(e){throw t.log("Unable to import WASI module: "+e),new Error("Unable to import WASI module.")}try{i=t.predict(n)}catch(e){throw t.log("Unable to generate prediction: "+e),new Error("Unable to generate prediction.")}return t.log("Local task generated output: "+JSON.stringify(i)),i},t.import=async function(e,n){let r,o="https://cdn.sclbl.net:8000/file/"+e+".wasm";if(WebAssembly.compileStreaming)r=await WebAssembly.compileStreaming(fetch(o));else{const t=await fetch(o),e=await t.arrayBuffer();r=await WebAssembly.compile(e)}let i={env:{},js:{mem:new WebAssembly.Memory({initial:t.settings.memoryMin,maximum:t.settings.memoryMax})}};i[t.getImportNamespace(r)]=n;const s=await WebAssembly.instantiate(r,i);n.setModuleInstance(s),s.exports._start(),t.cf=s},t.getImportNamespace=function(t){let e=null;for(let n of WebAssembly.Module.imports(t))if("function"===n.kind&&n.module.startsWith("wasi_"))if(e){if(e!==n.module)throw new Error("Multiple namespaces detected.")}else e=n.module;return e},t.predict=function(e){let n=e.length,r=t.cf.exports.malloc_buffer(n),o=new Uint8Array(t.cf.exports.memory.buffer);o.set(e,r),t.cf.exports.pred();let i=t.cf.exports.get_out_loc();t.cf.exports.free_buffer();let s=t.cf.exports.get_out_len(),c=(o=new Uint8Array(t.cf.exports.memory.buffer)).slice(i,i+s),a=(new TextDecoder).decode(c);return t.cf.exports.free_buffer(),a};let e=function(){let e=null;const n=0,r=8,o=28,i=52,s=1;function c(){return new DataView(e.memory.buffer)}return{setModuleInstance:function(t){e=t.exports},environ_sizes_get:function(e,r){t.log("Call to WASI.environ_sizes_get()");const o=c();return o.setUint32(e,0,!0),o.setUint32(r,0,!0),n},args_sizes_get:function(e,r){t.log("Call to WASI.args_sizes_get()");const o=c();return o.setUint32(e,0,!0),o.setUint32(r,0,!0),n},fd_prestat_get:function(e,n){return t.log("Call to WASI.fd_prestat_get()"),r},fd_fdstat_get:function(e,r){t.log("Call to WASI.fd_fdstat_get()");const o=c();function i(t,e,n){const r=e;o.setUint32(n?0:4,r,n),o.setUint32(n?4:0,0,n)}return o.setUint8(r,e),o.setUint16(r+2,0,!0),o.setUint16(r+4,0,!0),i(0,0,!0),i(0,0,!0),n},fd_write:function(r,o,i,a){t.log("Call to WASI.fd_write()");const l=c();let u=0;const f=[];return function(t,n){return Array.from({length:n},function(n,r){const o=t+8*r,i=l.getUint32(o,!0),s=l.getUint32(o+4,!0);return new Uint8Array(e.memory.buffer,i,s)})}(o,i).forEach(function(t){for(let e=0;e<t.byteLength;e++)f.push(t[e]);u+=b}),r===s&&t.log("Error in WASI:"+String.fromCharCode.apply(null,f)),l.setUint32(a,u,!0),n},fd_prestat_dir_name:function(e,n,r){return t.log("Call to WASI.fd_prestat_dir_name()"),o},environ_get:function(e,r){return t.log("Call to WASI.environ_get()"),n},args_get:function(e,r){return t.log("Call to WASI.args_get()"),n},poll_oneoff:function(e,n,r,o){return t.log("Call to WASI.poll_oneoff()"),i},proc_exit:function(e){return t.log("Call to WASI.proc_exit()"),i},fd_close:function(e){return t.log("Call to WASI.fd_close()"),i},fd_seek:function(e,n,r,o){t.log("Call to WASI.fd_seek()")},fd_fdstat_set_flags:function(){t.log("WASI.stub.1")},path_open:function(){t.log("WASI.stub.2")},fd_read:function(){t.log("WASI.stub.3")},fd_datasync:function(){t.log("WASI.stub.4")},random_get:function(){t.log("WASI.stub.5")},clock_res_get:function(){t.log("WASI.stub.6")},clock_time_get:function(){t.log("WASI.stub.7")},getModuleMemoryDataView:c}};return t.stringHasCorrectJSONStructure=function(t){let e;if("string"!=typeof t)return!1;try{e=JSON.parse(t);const n=Object.prototype.toString.call(e);return"[object Object]"===n||"[object Array]"===n}catch(t){return!1}return!("input"in t)},t.runRemote=async function(e,n){t.log("Trying to run task remotely.");let r,o=new Headers;if(o.append("Content-Type","application/x-www-form-urlencoded"),t.stringHasCorrectJSONStructure(e))r=e;else{let t={input:e};r=JSON.stringify(t)}let i={input:{"content-type":"json",location:"embedded",data:r},output:{"content-type":"json",location:"echo"},control:1,properties:{language:"WASM"}},s={method:"POST",headers:o,body:JSON.stringify(i),redirect:"follow"},c=await fetch("https://taskmanager.sclbl.net:8080/task/"+n,s).then(t=>t.text()).then(function(t){return t}).catch(function(e){throw t.log("Unable to generate remote prediction: "+e),new Error("Unable to generate remote prediction.")});return t.log("Remote task generated output: "+JSON.stringify(c)),c},t.log=function(e){t.settings.debug&&console.log(e)},t.log("Running sclblRuntime in debug mode."),t}();