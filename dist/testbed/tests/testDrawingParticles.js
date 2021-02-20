var e_parameterBegin = (1 << 31); // Start of this parameter namespace.
var e_parameterMove = e_parameterBegin | (1 << 0);
var e_parameterRigid = e_parameterBegin | (1 << 1);
var e_parameterRigidBarrier = e_parameterBegin | (1 << 2);
var e_parameterElasticBarrier = e_parameterBegin | (1 << 3);
var e_parameterSpringBarrier = e_parameterBegin | (1 << 4);
var e_parameterRepulsive = e_parameterBegin | (1 << 5);

const visibleHeightAtZDepth = ( depth, camera ) => {
  // compensate for cameras not positioned at z=0
  const cameraOffset = camera.position.z;
  if ( depth < cameraOffset ) depth -= cameraOffset;
  else depth += cameraOffset;

  // vertical fov in radians
  const vFOV = camera.fov * Math.PI / 180; 

  // Math.abs to ensure the result is always positive
  return 2 * Math.tan( vFOV / 2 ) * Math.abs( depth );
};

const visibleWidthAtZDepth = ( depth, camera ) => {
  const height = visibleHeightAtZDepth( depth, camera );
  return height * camera.aspect;
};

var height;
var width;

function TestDrawingParticles() {
  camera.position.y = 0;
  camera.position.z = 6;

  height = visibleHeightAtZDepth(6, camera);
  width = visibleWidthAtZDepth(6, camera);

  console.log("Height:",height, "Width:", width);
  var bd = new liquidfun.b2BodyDef;
  var ground = world.CreateBody(bd);

  var shape = new liquidfun.b2PolygonShape;
  shape.vertices.push(new liquidfun.b2Vec2(-width/4, -height/4));
  shape.vertices.push(new liquidfun.b2Vec2(width/4, -height/4));
  shape.vertices.push(new liquidfun.b2Vec2(width/4, (-height/4)-1));
  shape.vertices.push(new liquidfun.b2Vec2(-width/4, (-height/4)-1));
  ground.CreateFixtureFromShape(shape, 0.0);

  shape = new liquidfun.b2PolygonShape;
  shape.vertices.push(new liquidfun.b2Vec2(-width/4, -height/4));
  shape.vertices.push(new liquidfun.b2Vec2(-width/4, height/4));
  shape.vertices.push(new liquidfun.b2Vec2((-width/4)-1, height/4));
  shape.vertices.push(new liquidfun.b2Vec2((-width/4)-1, -height/4));
  ground.CreateFixtureFromShape(shape, 0.0);

  shape = new liquidfun.b2PolygonShape;
  shape.vertices.push(new liquidfun.b2Vec2(width/4, -height/4));
  shape.vertices.push(new liquidfun.b2Vec2(width/4, height/4));
  shape.vertices.push(new liquidfun.b2Vec2((width/4)+1, height/4));
  shape.vertices.push(new liquidfun.b2Vec2((width/4)+1, -height/4));
  ground.CreateFixtureFromShape(shape, 0.0);

  shape = new liquidfun.b2PolygonShape;
  shape.vertices.push(new liquidfun.b2Vec2(-width/4, height/4));
  shape.vertices.push(new liquidfun.b2Vec2(width/4, height/4));
  shape.vertices.push(new liquidfun.b2Vec2(width/4, (height/4)+1));
  shape.vertices.push(new liquidfun.b2Vec2(-width/4, (height/4)+1));
  ground.CreateFixtureFromShape(shape, 0.0);

  this.colorIndex = 0;
  var psd = new liquidfun.b2ParticleSystemDef();
  psd.radius = 0.1;

  this.particleSystem = world.CreateParticleSystem(psd);
  window.part = this.particleSystem;
  this.lastGroup = null;
  this.drawing = false;

  this.particleFlags = 0;
  this.groupFlags = 0;
}

/**@return number*/
TestDrawingParticles.prototype.DetermineParticleParameter = function() {
  if (this.drawing) {
    if (this.groupFlags === (liquidfun.b2_rigidParticleGroup |
      liquidfun.b2_solidParticleGroup)) {
      return e_parameterRigid;
    }
    if (this.groupFlags === liquidfun.b2_rigidParticleGroup &&
      this.particleFlags === liquidfun.b2_barrierParticle) {
      return e_parameterRigidBarrier;
    }
    if (this.particleFlags === (liquidfun.b2_elasticParticle | liquidfun.b2_barrierParticle)) {
      return e_parameterElasticBarrier;
    }
    if (this.particleFlags == (liquidfun.b2_springParticle | liquidfun.b2_barrierParticle)) {
      return e_parameterSpringBarrier;
    }
    if (this.particleFlags == (liquidfun.b2_wallParticle | liquidfun.b2_repulsiveParticle)) {
      return e_parameterRepulsive;
    }
    return this.particleFlags;
  }
  return e_parameterMove;
};

var interval = null;

TestDrawingParticles.prototype.insert = function() {
  _this = this;
  if(interval!=null){
    clearInterval(interval);
    interval=null;
    return;
  }
  interval = setInterval(()=>{
    var p = {x: RandomFloat(-width/4, width/4), y: RandomFloat(-height/4, height/4)}
    var shape = new liquidfun.b2CircleShape;
    shape.position = p;
    shape.radius = 0.2;
    var xf = new liquidfun.b2Transform;
    xf.SetIdentity();
  
    _this.particleSystem.DestroyParticlesInShape(shape, xf);
  
    var joinGroup =
    _this.lastGroup && _this.groupFlags === _this.lastGroup.GetGroupFlags();
    if (!joinGroup) {
      _this.colorIndex = (_this.colorIndex + 1) % particleColors.length;
    }
    var pd = new liquidfun.b2ParticleGroupDef();
    pd.shape = shape;
    pd.flags = _this.particleFlags;
    if ((_this.particleFlags &
      (liquidfun.b2_wallParticle | liquidfun.b2_springParticle | liquidfun.b2_elasticParticle)) ||
      (_this.particleFlags === (liquidfun.b2_wallParticle | liquidfun.b2_barrierParticle))) {
      pd.flags |= liquidfun.b2_reactiveParticle;
    }
    pd.groupFlags = _this.groupFlags;
    pd.color = new liquidfun.b2ParticleColor(0x00, 0xba, 0xa3, 0xff);
    if (_this.lastGroup !== null) {
      pd.group = _this.lastGroup;
    }
    _this.lastGroup = _this.particleSystem.CreateParticleGroup(pd);
    _this.mouseTracing = false;
  },0);
};

TestDrawingParticles.prototype.ParticleGroupDestroyed = function(group) {
  if (group === this.lastGroup) {
    this.lastGroup = null;
  }
};
