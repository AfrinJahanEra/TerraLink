import{r as e}from"./rolldown-runtime-hePW80VL.js";import{n as t,t as n}from"./jsx-runtime-BNakU3Ej.js";import{C as r,S as i,_ as a,a as o,b as s,c,d as l,f as u,g as d,h as f,i as p,l as m,m as h,n as g,o as _,p as v,r as y,s as b,t as ee,u as te,v as x,x as S,y as C}from"./Sparkles-BXbhNZU5.js";var w=parseInt(`186`.replace(/\D+/g,``)),T=w>=125?`uv1`:`uv2`,ne=new b,E=new S,D=class extends te{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type=`LineSegmentsGeometry`,this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute(`position`,new m([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute(`uv`,new m([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return t!==void 0&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new l(t,6,1);return this.setAttribute(`instanceStart`,new u(n,3,0)),this.setAttribute(`instanceEnd`,new u(n,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));let r=new l(n,t*2,1);return this.setAttribute(`instanceColorStart`,new u(r,t,0)),this.setAttribute(`instanceColorEnd`,new u(r,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new r(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new b);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;e!==void 0&&t!==void 0&&(this.boundingBox.setFromBufferAttribute(e),ne.setFromBufferAttribute(t),this.boundingBox.union(ne))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new x),this.boundingBox===null&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(e!==void 0&&t!==void 0){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let r=0;for(let i=0,a=e.count;i<a;i++)E.fromBufferAttribute(e,i),r=Math.max(r,n.distanceToSquared(E)),E.fromBufferAttribute(t,i),r=Math.max(r,n.distanceToSquared(E));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error(`THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.`,this)}}toJSON(){}applyMatrix(e){return console.warn(`THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4().`),this.applyMatrix4(e)}},O=class extends D{constructor(){super(),this.isLineGeometry=!0,this.type=`LineGeometry`}setPositions(e){let t=e.length-3,n=new Float32Array(2*t);for(let r=0;r<t;r+=3)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];return super.setPositions(n),this}setColors(e,t=3){let n=e.length-t,r=new Float32Array(2*n);if(t===3)for(let i=0;i<n;i+=t)r[2*i]=e[i],r[2*i+1]=e[i+1],r[2*i+2]=e[i+2],r[2*i+3]=e[i+3],r[2*i+4]=e[i+4],r[2*i+5]=e[i+5];else for(let i=0;i<n;i+=t)r[2*i]=e[i],r[2*i+1]=e[i+1],r[2*i+2]=e[i+2],r[2*i+3]=e[i+3],r[2*i+4]=e[i+4],r[2*i+5]=e[i+5],r[2*i+6]=e[i+6],r[2*i+7]=e[i+7];return super.setColors(r,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}},k=class extends a{constructor(e){super({type:`LineMaterial`,uniforms:C.clone(C.merge([_.common,_.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new s(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${w>=154?`colorspace_fragment`:`encodings_fragment`}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA=`1`:delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return`WORLD_UNITS`in this.defines},set:function(e){e===!0?this.defines.WORLD_UNITS=``:delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return`USE_DASH`in this.defines},set(e){!!e!=`USE_DASH`in this.defines&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH=``:delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return`USE_ALPHA_TO_COVERAGE`in this.defines},set:function(e){!!e!=`USE_ALPHA_TO_COVERAGE`in this.defines&&(this.needsUpdate=!0),e===!0?(this.defines.USE_ALPHA_TO_COVERAGE=``,this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}},A=new i,j=new S,M=new S,N=new i,P=new i,F=new i,I=new S,L=new f,R=new v,z=new S,B=new b,V=new x,H=new i,U,W;function G(e,t,n){return H.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),H.multiplyScalar(1/H.w),H.x=W/n.width,H.y=W/n.height,H.applyMatrix4(e.projectionMatrixInverse),H.multiplyScalar(1/H.w),Math.abs(Math.max(H.x,H.y))}function re(e,t){let n=e.matrixWorld,r=e.geometry,i=r.attributes.instanceStart,a=r.attributes.instanceEnd,o=Math.min(r.instanceCount,i.count);for(let r=0,s=o;r<s;r++){R.start.fromBufferAttribute(i,r),R.end.fromBufferAttribute(a,r),R.applyMatrix4(n);let o=new S,s=new S;U.distanceSqToSegment(R.start,R.end,s,o),s.distanceTo(o)<W*.5&&t.push({point:s,pointOnLine:o,distance:U.origin.distanceTo(s),object:e,face:null,faceIndex:r,uv:null,[T]:null})}}function ie(e,t,n){let r=t.projectionMatrix,i=e.material.resolution,a=e.matrixWorld,o=e.geometry,s=o.attributes.instanceStart,c=o.attributes.instanceEnd,l=Math.min(o.instanceCount,s.count),u=-t.near;U.at(1,F),F.w=1,F.applyMatrix4(t.matrixWorldInverse),F.applyMatrix4(r),F.multiplyScalar(1/F.w),F.x*=i.x/2,F.y*=i.y/2,F.z=0,I.copy(F),L.multiplyMatrices(t.matrixWorldInverse,a);for(let t=0,o=l;t<o;t++){if(N.fromBufferAttribute(s,t),P.fromBufferAttribute(c,t),N.w=1,P.w=1,N.applyMatrix4(L),P.applyMatrix4(L),N.z>u&&P.z>u)continue;if(N.z>u){let e=N.z-P.z,t=(N.z-u)/e;N.lerp(P,t)}else if(P.z>u){let e=P.z-N.z,t=(P.z-u)/e;P.lerp(N,t)}N.applyMatrix4(r),P.applyMatrix4(r),N.multiplyScalar(1/N.w),P.multiplyScalar(1/P.w),N.x*=i.x/2,N.y*=i.y/2,P.x*=i.x/2,P.y*=i.y/2,R.start.copy(N),R.start.z=0,R.end.copy(P),R.end.z=0;let o=R.closestPointToPointParameter(I,!0);R.at(o,z);let l=h.lerp(N.z,P.z,o),d=l>=-1&&l<=1,f=I.distanceTo(z)<W*.5;if(d&&f){R.start.fromBufferAttribute(s,t),R.end.fromBufferAttribute(c,t),R.start.applyMatrix4(a),R.end.applyMatrix4(a);let r=new S,i=new S;U.distanceSqToSegment(R.start,R.end,i,r),n.push({point:i,pointOnLine:r,distance:U.origin.distanceTo(i),object:e,face:null,faceIndex:t,uv:null,[T]:null})}}}var K=class extends d{constructor(e=new D,t=new k({color:Math.random()*16777215})){super(e,t),this.isLineSegments2=!0,this.type=`LineSegments2`}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,r=new Float32Array(2*t.count);for(let e=0,i=0,a=t.count;e<a;e++,i+=2)j.fromBufferAttribute(t,e),M.fromBufferAttribute(n,e),r[i]=i===0?0:r[i-1],r[i+1]=r[i]+j.distanceTo(M);let i=new l(r,2,1);return e.setAttribute(`instanceDistanceStart`,new u(i,1,0)),e.setAttribute(`instanceDistanceEnd`,new u(i,1,1)),this}raycast(e,t){let n=this.material.worldUnits,r=e.camera;r===null&&!n&&console.error(`LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.`);let i=e.params.Line2===void 0?0:e.params.Line2.threshold||0;U=e.ray;let a=this.matrixWorld,o=this.geometry,s=this.material;W=s.linewidth+i,o.boundingSphere===null&&o.computeBoundingSphere(),V.copy(o.boundingSphere).applyMatrix4(a);let c;if(c=n?W*.5:G(r,Math.max(r.near,V.distanceToPoint(U.origin)),s.resolution),V.radius+=c,U.intersectsSphere(V)===!1)return;o.boundingBox===null&&o.computeBoundingBox(),B.copy(o.boundingBox).applyMatrix4(a);let l;l=n?W*.5:G(r,Math.max(r.near,B.distanceToPoint(U.origin)),s.resolution),B.expandByScalar(l),U.intersectsBox(B)!==!1&&(n?re(this,t):ie(this,r,t))}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(A),this.material.uniforms.resolution.value.set(A.z,A.w))}},ae=class extends K{constructor(e=new O,t=new k({color:Math.random()*16777215})){super(e,t),this.isLine2=!0,this.type=`Line2`}},q=e(t()),J=q.forwardRef(function({points:e,color:t=16777215,vertexColors:n,linewidth:r,lineWidth:a,segments:l,dashed:u,...d},f){var p;let m=o(e=>e.size),h=q.useMemo(()=>l?new K:new ae,[l]),[_]=q.useState(()=>new k),v=(n==null||(p=n[0])==null?void 0:p.length)===4?4:3,y=q.useMemo(()=>{let r=l?new D:new O,a=e.map(e=>{let t=Array.isArray(e);return e instanceof S||e instanceof i?[e.x,e.y,e.z]:e instanceof s?[e.x,e.y,0]:t&&e.length===3?[e[0],e[1],e[2]]:t&&e.length===2?[e[0],e[1],0]:e});if(r.setPositions(a.flat()),n){t=16777215;let e=n.map(e=>e instanceof c?e.toArray():e);r.setColors(e.flat(),v)}return r},[e,l,n,v]);return q.useLayoutEffect(()=>{h.computeLineDistances()},[e,h]),q.useLayoutEffect(()=>{u?_.defines.USE_DASH=``:delete _.defines.USE_DASH,_.needsUpdate=!0},[u,_]),q.useEffect(()=>()=>{y.dispose(),_.dispose()},[y]),q.createElement(`primitive`,g({object:h,ref:f},d),q.createElement(`primitive`,{object:y,attach:`geometry`}),q.createElement(`primitive`,g({object:_,attach:`material`,color:t,vertexColors:!!n,resolution:[m.width,m.height],linewidth:r??a??1,dashed:u,transparent:v===4},d)))}),oe=q.forwardRef(({children:e,enabled:t=!0,speed:n=1,rotationIntensity:r=1,floatIntensity:i=1,floatingRange:a=[-.1,.1],autoInvalidate:o=!1,...s},c)=>{let l=q.useRef(null);q.useImperativeHandle(c,()=>l.current,[]);let u=q.useRef(Math.random()*1e4);return p(e=>{if(!t||n===0)return;o&&e.invalidate();let s=u.current+e.clock.elapsedTime;l.current.rotation.x=Math.cos(s/4*n)/8*r,l.current.rotation.y=Math.sin(s/4*n)/8*r,l.current.rotation.z=Math.sin(s/4*n)/20*r;let c=Math.sin(s/4*n)/10;c=h.mapLinear(c,-.1,.1,a?.[0]??-.1,a?.[1]??.1),l.current.position.y=c*i,l.current.updateMatrix()}),q.createElement(`group`,s,q.createElement(`group`,{ref:l,matrixAutoUpdate:!1},e))}),Y=n(),X=2,se=.4,Z=typeof window<`u`&&!window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;function Q(e,t,n){let r=(90-e)*(Math.PI/180),i=(t+180)*(Math.PI/180);return new S(-n*Math.sin(r)*Math.cos(i),n*Math.cos(r),n*Math.sin(r)*Math.sin(i))}var $=[{lat:23.8,lon:90.4},{lat:24,lon:89},{lat:22.4,lon:91.8},{lat:25.1,lon:89}];function ce(){return(0,Y.jsxs)(`group`,{children:[(0,Y.jsxs)(`mesh`,{children:[(0,Y.jsx)(`sphereGeometry`,{args:[X,64,64]}),(0,Y.jsx)(`meshStandardMaterial`,{color:`#0c352c`,roughness:.95,metalness:.08})]}),(0,Y.jsxs)(`mesh`,{scale:1.06,children:[(0,Y.jsx)(`sphereGeometry`,{args:[X,64,64]}),(0,Y.jsx)(`meshBasicMaterial`,{color:`#22d3ee`,transparent:!0,opacity:.08,blending:2,depthWrite:!1})]}),(0,Y.jsxs)(`mesh`,{scale:1.008,children:[(0,Y.jsx)(`icosahedronGeometry`,{args:[X,1]}),(0,Y.jsx)(`meshBasicMaterial`,{color:`#12443a`,wireframe:!0,transparent:!0,opacity:.1})]})]})}function le(){return(0,Y.jsx)(`group`,{children:$.map(e=>(0,Y.jsxs)(`mesh`,{position:Q(e.lat,e.lon,X*1.01),children:[(0,Y.jsx)(`sphereGeometry`,{args:[.035,16,16]}),(0,Y.jsx)(`meshBasicMaterial`,{color:`#a5f3fc`})]},`${e.lat}-${e.lon}`))})}function ue(){let e=(0,q.useRef)([]),t=(0,q.useMemo)(()=>{let e=Q($[0].lat,$[0].lon,X*1.006);return $.slice(1).map(t=>{let n=Q(t.lat,t.lon,X*1.006),r=[];for(let t=0;t<=42;t+=1){let i=t/42,a=e.clone().lerp(n,i).normalize();a.multiplyScalar(X*(1.006+.16*Math.sin(Math.PI*i))),r.push(a)}return r})},[]);return p(t=>{if(!Z)return;let n=t.clock.getElapsedTime();e.current.forEach(e=>{e&&(e.dashOffset=-n*.35)})}),(0,Y.jsx)(`group`,{children:t.map((t,n)=>(0,Y.jsx)(J,{points:t,color:`#67e8f9`,lineWidth:1,transparent:!0,opacity:.45,dashed:!0,dashSize:.13,gapSize:.09,ref:t=>{e.current[n]=t?.material}},`${$[n+1].lat}-${$[n+1].lon}`))})}function de(){let e=(0,q.useRef)();return p(t=>{if(!Z||!e.current)return;let n=t.clock.getElapsedTime()%2.4/2.4;e.current.scale.setScalar(.2+n*.9),e.current.material.opacity=.4*(1-n)}),(0,Y.jsxs)(`mesh`,{ref:e=>e?.lookAt(0,0,0),position:Q($[0].lat,$[0].lon,X*1.015),children:[(0,Y.jsx)(`ringGeometry`,{args:[.42,.5,40]}),(0,Y.jsx)(`meshBasicMaterial`,{color:`#22d3ee`,transparent:!0,opacity:.3,side:2,depthWrite:!1})]})}function fe({radius:e,speed:t,offset:n=0,reverse:r=!1,size:i=1,instrumented:a=!1}){let o=(0,q.useRef)(),s=(0,q.useRef)(),c=(0,q.useRef)(),l=(0,q.useRef)(),u=e-X+.02;return p(e=>{if(!o.current||!Z)return;let i=e.clock.getElapsedTime();o.current.rotation.y=n+i*t*(r?-1:1),o.current.rotation.x=.32+Math.sin(i*.4)*.03,a&&(l.current&&(l.current.dashOffset=-i*.6),[s,c].forEach((e,t)=>{e.current&&(e.current.position.x=-((i*.5+t*.5)%1*u))}))}),(0,Y.jsx)(`group`,{ref:o,rotation:[.32,n,0],children:(0,Y.jsxs)(`group`,{position:[e,0,0],children:[(0,Y.jsx)(oe,{speed:Z?2.2:0,rotationIntensity:Z?.3:0,floatIntensity:Z?.7:0,children:(0,Y.jsxs)(`group`,{scale:i,children:[(0,Y.jsxs)(`mesh`,{children:[(0,Y.jsx)(`boxGeometry`,{args:[.2,.14,.14]}),(0,Y.jsx)(`meshStandardMaterial`,{color:`#cbd5e1`,metalness:.6,roughness:.35})]}),(0,Y.jsxs)(`mesh`,{position:[0,0,.075],children:[(0,Y.jsx)(`boxGeometry`,{args:[.14,.1,.014]}),(0,Y.jsx)(`meshStandardMaterial`,{color:`#164e63`,emissive:`#22d3ee`,emissiveIntensity:.45})]}),(0,Y.jsxs)(`mesh`,{position:[-.24,0,0],children:[(0,Y.jsx)(`boxGeometry`,{args:[.26,.012,.15]}),(0,Y.jsx)(`meshStandardMaterial`,{color:`#155e75`,metalness:.4,roughness:.4})]}),(0,Y.jsxs)(`mesh`,{position:[.24,0,0],children:[(0,Y.jsx)(`boxGeometry`,{args:[.26,.012,.15]}),(0,Y.jsx)(`meshStandardMaterial`,{color:`#155e75`,metalness:.4,roughness:.4})]})]})}),a&&(0,Y.jsxs)(`group`,{children:[(0,Y.jsx)(J,{points:[[-.12,0,0],[-u,0,0]],color:`#22d3ee`,lineWidth:1,transparent:!0,opacity:.3,dashed:!0,dashSize:.12,gapSize:.1,ref:e=>{l.current=e?.material}}),(0,Y.jsxs)(`mesh`,{ref:s,children:[(0,Y.jsx)(`sphereGeometry`,{args:[.032,8,8]}),(0,Y.jsx)(`meshBasicMaterial`,{color:`#a5f3fc`})]}),(0,Y.jsxs)(`mesh`,{ref:c,children:[(0,Y.jsx)(`sphereGeometry`,{args:[.032,8,8]}),(0,Y.jsx)(`meshBasicMaterial`,{color:`#a5f3fc`})]}),(0,Y.jsxs)(`mesh`,{position:[-.8,0,0],rotation:[0,0,Math.PI/2],children:[(0,Y.jsx)(`coneGeometry`,{args:[.5,1.35,24,1,!0]}),(0,Y.jsx)(`meshBasicMaterial`,{color:`#22d3ee`,transparent:!0,opacity:.05,side:2,depthWrite:!1})]})]})]})})}function pe({radius:e,opacity:t=.22}){return(0,Y.jsxs)(`mesh`,{rotation:[Math.PI/2,0,0],children:[(0,Y.jsx)(`torusGeometry`,{args:[e,.004,8,128]}),(0,Y.jsx)(`meshBasicMaterial`,{color:`#67e8f9`,transparent:!0,opacity:t})]})}function me(){let e=(0,q.useRef)();return p(t=>{Z&&e.current&&(e.current.rotation.z=.38+Math.sin(t.clock.getElapsedTime()*.08)*.03)}),(0,Y.jsxs)(`group`,{ref:e,rotation:[.32,0,.38],children:[(0,Y.jsx)(pe,{radius:3.1,opacity:.3}),(0,Y.jsx)(pe,{radius:3.7,opacity:.18}),(0,Y.jsx)(fe,{radius:3.1,speed:.32,offset:.9,instrumented:!0}),(0,Y.jsx)(fe,{radius:3.7,speed:.21,offset:3.6,reverse:!0,size:.8}),(0,Y.jsxs)(`mesh`,{position:[-3.7,0,0],children:[(0,Y.jsx)(`sphereGeometry`,{args:[.04,16,16]}),(0,Y.jsx)(`meshBasicMaterial`,{color:`#e2e8f0`})]})]})}function he(){let e=(0,q.useRef)();return p((t,n)=>{Z&&e.current&&(e.current.rotation.y+=n*.05)}),(0,Y.jsxs)(`group`,{ref:e,rotation:[se,.4,0],children:[(0,Y.jsx)(ce,{}),(0,Y.jsx)(le,{}),(0,Y.jsx)(ue,{}),(0,Y.jsx)(de,{}),(0,Y.jsxs)(`mesh`,{position:[0,1.25,0],rotation:[.5,0,.35],children:[(0,Y.jsx)(`coneGeometry`,{args:[1.6,2.6,40,1,!0]}),(0,Y.jsx)(`meshBasicMaterial`,{color:`#22d3ee`,transparent:!0,opacity:.045,side:2,depthWrite:!1})]})]})}function ge({variant:e}){let t=o(e=>e.size.width>=1024);return p((n,r)=>{if(!Z)return;let i=n.clock.getElapsedTime(),a=e===`feature`,o=(a?0:.4)+n.pointer.x*(a?.24:.5),s=(a?.62:1.05)+n.pointer.y*(a?.16:.28)+Math.sin(i*.22)*.12;n.camera.position.x=h.damp(n.camera.position.x,o,2.2,r),n.camera.position.y=h.damp(n.camera.position.y,s,2.2,r),n.camera.lookAt(a?0:t?.5:0,a?-.2:-.1,0)}),null}function _e({variant:e}){let t=o(e=>e.size.width),n=e===`feature`;return(0,Y.jsxs)(`group`,{position:n?[0,-.25,0]:t>=1024?[3.05,-.45,0]:[0,-.3,0],scale:n?.82:1,children:[(0,Y.jsx)(he,{}),(0,Y.jsx)(me,{}),(0,Y.jsx)(ee,{count:n?110:170,scale:[13,9,8],size:1.5,speed:Z?.25:0,opacity:.55,color:`#a5f3fc`,position:[0,.5,-1.5]})]})}function ve({variant:e=`hero`}){let t=e===`feature`;return(0,Y.jsxs)(y,{dpr:[1,1.75],camera:{position:t?[0,.62,9.4]:[.4,1.1,8.6],fov:t?44:42},gl:{antialias:!0,alpha:!0},style:{position:`absolute`,inset:0},children:[(0,Y.jsx)(`ambientLight`,{intensity:.55}),(0,Y.jsx)(`directionalLight`,{position:[6,4,5],intensity:1.6,color:`#e2f5f2`}),(0,Y.jsx)(`directionalLight`,{position:[-6,-2,-4],intensity:.5,color:`#0e7490`}),(0,Y.jsx)(_e,{variant:e}),(0,Y.jsx)(ge,{variant:e})]})}function ye(){return(0,Y.jsxs)(`div`,{"aria-hidden":`true`,className:`absolute inset-0 overflow-hidden`,children:[(0,Y.jsx)(`div`,{className:`absolute -bottom-44 -right-40 size-[520px] rounded-full border border-white/10`}),(0,Y.jsx)(`div`,{className:`absolute -bottom-28 -right-24 size-[380px] rounded-full border border-white/10`}),(0,Y.jsx)(`div`,{className:`absolute -bottom-12 -right-8 size-[250px] rounded-full border border-cyan-300/20`}),(0,Y.jsx)(`div`,{className:`absolute right-24 top-24 size-2 rounded-full bg-cyan-300/70`}),(0,Y.jsx)(`div`,{className:`absolute right-64 top-48 size-1.5 rounded-full bg-white/40`}),(0,Y.jsx)(`div`,{className:`absolute bottom-64 right-10 size-1.5 rounded-full bg-white/30`})]})}var be=class extends q.Component{constructor(e){super(e),this.state={failed:!1}}static getDerivedStateFromError(){return{failed:!0}}componentDidCatch(e){console.warn(`TerraLink space scene fell back to static visuals:`,e)}render(){return this.state.failed?(0,Y.jsx)(ye,{}):(0,Y.jsx)(ve,{variant:this.props.variant})}};function xe({variant:e=`hero`}){return(0,Y.jsx)(`div`,{className:`absolute inset-0`,"aria-hidden":`true`,children:(0,Y.jsx)(be,{variant:e})})}export{xe as SpaceScene};