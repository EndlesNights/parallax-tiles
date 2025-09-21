const MODULE_ID = `parallax-tiles`;

Hooks.once('setup', registerModuleSettings);

Hooks.once("init", async function() {
	console.log("parallax Module Test");
	
	game.parallaxTiles = {
		getParallaxTiles,
		parallaxafyTileArray,
		parallaxTileArray:[]
	};
});


Hooks.on("renderTileConfig", (app, html, data) => {
	html = html[0] ?? html;

	const wasLastActive = app.tabGroups.sheet == 'parallax';

	//create new tab
	if (wasLastActive) {
		html.form.querySelector(`.sheet-tabs`).insertAdjacentHTML("beforeend", `	
		<a data-action="tab" data-group="sheet" data-tab="parallax" class="active">
			<i class="fa-solid fa-house" inert=""></i>
			<span>Parallax</span>
		</a>
		`);
	} else {
		html.form.querySelector(`.sheet-tabs`).insertAdjacentHTML("beforeend", `	
		<a data-action="tab" data-group="sheet" data-tab="parallax">
			<i class="fa-solid fa-house" inert=""></i>
			<span>Parallax</span>
		</a>
		`);
	}

	const enableCheckbox = app.document.getFlag(MODULE_ID, "enable") ? "checked" : "";
	const modeSelector = app.document.getFlag(MODULE_ID, "mode") || 0
	const maxDisplacement = app.document.getFlag(MODULE_ID, "maxDisplacement") ?? getDefaultMaxDisplacement(); //make this default to 1 grid of px
	const parallaxFactor = app.document.getFlag(MODULE_ID, "parallaxFactor") ?? game.settings.get(MODULE_ID, "defaultParallaxFactor");
	const lockX = app.document.getFlag(MODULE_ID, "lockX") ? "checked" : "";
	const lockY = app.document.getFlag(MODULE_ID, "lockY") ? "checked" : "";

	let tabActiveOrNot = "tab";
	if (wasLastActive) {
		tabActiveOrNot = "tab active";
	}

	//create tab content
	html.form.querySelector(`.form-footer`).insertAdjacentHTML("beforebegin", `	
	<div class="${tabActiveOrNot}" data-group="sheet" data-tab="parallax" data-application-part="parallax">
		<p class="notes">Parallax-Tile Options Here.</p>
		<div class="form-group">
			<label>Enable Parallax Tile</label>
			<div class="form-fields">
				<input type="checkbox" name="flags.${MODULE_ID}.enable" ${enableCheckbox}>
			</div>
		</div>

		<div class="form-group">
			<label>Parallax Mode</label>
			<div class="form-fields">
			<select name="flags.${MODULE_ID}.mode" data-dtype="Number">
				<option value="0" ${modeSelector==0 ? "selected":""}>Mesh Mode</option>
				<option value="1" ${modeSelector==1 ? "selected":""}>Texture Mode</option>
			</select>
			</div>
			<p class="hint">Mesh Mode: The tiles mesh moves realitive to the canvis.</p>
			<p class="hint">Texture Mode: The tiles mesh stays still, but the texture movies. Requires seemless texture for best effect</p>
		</div>

		<div class="form-group">
			<label>Max Displacement</label>
			<div class="form-fields">
				<input type="number" step="any" name="flags.${MODULE_ID}.maxDisplacement" value="${maxDisplacement}" placeholder="${getDefaultMaxDisplacement()}">
			</div>
			<p class="hint">The maximum value in pixels that the token can be displaced from its origin. (Default to scene grid size)</p>
		</div>	

		<div class="form-group">
			<label>Parallax Factor</label>
			<div class="form-fields">
				<input type="text" step="0.1" name="flags.${MODULE_ID}.parallaxFactor" value="${parallaxFactor}" placeholder="${game.settings.get(MODULE_ID, "defaultParallaxFactor")}">
			</div>
			<p class="hint">Equation for determining the strength of the parallax in respect to the relative positions canvas.\nFor example you may enter <code>@elevation * 0.1</code> which will use 1/10th of the tiles elevation value for the Parallax Factor.</p>
		</div>

		<div class="form-group">
			<label>Lock Axis: <strong>X</strong></label>
			<div class="form-fields">
				<input type="checkbox" name="flags.${MODULE_ID}.lockX" ${lockX}>
			</div>
		</div>	
		<div class="form-group">
			<label>Lock Axis: <strong>Y</strong></label>
			<div class="form-fields">
				<input type="checkbox" name="flags.${MODULE_ID}.lockY" ${lockY}>
			</div>
		</div>	
	</div>		
	`);

});

Hooks.on("ready",() =>{
	if(!game.settings.get(MODULE_ID, "enableClient")) return;
	game.parallaxTiles.parallaxTileArray = getParallaxTiles();
	parallaxafyTileArray();
});

//For the preveiw
Hooks.on("refreshTile",(tile) => {
	if(!game.settings.get(MODULE_ID, "enableClient")) return;
	preComputeParallaxFactor(tile.document);

	game.parallaxTiles.parallaxTileArray = getParallaxTiles();
	parallaxafyTileArray();
});


Hooks.on("updateTile", (tile)=>{
	preComputeParallaxFactor(tile);
});

//make the magic happen!
Hooks.on("canvasPan", (scene, screenPosistion) => {
	if(!game.settings.get(MODULE_ID, "enableClient")) return;
	parallaxafyTileArray();
});

function parallaxafyTileArray(){
	for(const tile of game.parallaxTiles.parallaxTileArray){
		parallaxafyTile(tile);
	}
}

function parallaxafyTile(tile){
	if(tile.getFlag(MODULE_ID, "mode")){
		parallaxafyTileTexture(tile);
	} else {
		parallaxafyTileMesh(tile);
	}
}

function preComputeParallaxFactor(tile){
	const parallaxFactor = tile.getFlag(MODULE_ID, "parallaxFactor");

	if(isEmpty(parallaxFactor) || parallaxFactor === ''){
		return tile.precomputedParallaxFactor = game.settings.get(MODULE_ID, "defaultParallaxFactor"); //"Input is neither a number nor a valid mathematical equation"
	}

	let input = tile.getFlag(MODULE_ID, "parallaxFactor");

	// Check if the input is only a number
	if (!isNaN(input)) {
		return tile.precomputedParallaxFactor = Number(input);
	}

	let r = new Roll(parallaxFactor.replaceAll("@elevation", Math.abs(tile.elevation)));

	if(r.isDeterministic){
		if(foundry.utils.isNewerVersion(game.version , 12)) { r.evaluateSync(); } //check version
		else { r.roll({async : false}); } //v11 support 

		return tile.precomputedParallaxFactor = r.total;
	}

	return tile.precomputedParallaxFactor = game.settings.get(MODULE_ID, "defaultParallaxFactor"); //"Input is neither a number nor a valid mathematical equation"
}

function computeParallaxFactor(tile){
	if(tile.precomputedParallaxFactor) return tile.precomputedParallaxFactor;

	return preComputeParallaxFactor(tile);
}

function parallaxafyTileMesh(tile){
	const lockX = tile.getFlag(MODULE_ID, "lockX");
	const lockY = tile.getFlag(MODULE_ID, "lockY");
	const parallaxFactor = computeParallaxFactor(tile);

	const maxOffset = tile.getFlag(MODULE_ID, "maxDisplacement") ?? getDefaultMaxDisplacement();
	
	if(lockX && lockY || !parallaxFactor || !maxOffset) return;


	let objectMeshCenterX = tile.object.x + tile.object.mesh.width / 2;
	let objectMeshCenterY = tile.object.y + tile.object.mesh.height / 2;

	// Calculate the distance between the camera center and the object's mesh center
	let deltaX = canvas.stage.pivot.x - objectMeshCenterX;
	let deltaY = canvas.stage.pivot.y - objectMeshCenterY;

	// Apply the parallax effect
	let rawParallaxOffsetX = deltaX * parallaxFactor * 0.1;
	let rawParallaxOffsetY = deltaY * parallaxFactor * 0.1;

	// Constrain the parallax offset using a smooth approach with tanh
	let parallaxOffsetX = maxOffset * Math.tanh(rawParallaxOffsetX / maxOffset);
	let parallaxOffsetY = maxOffset * Math.tanh(rawParallaxOffsetY / maxOffset);

	// Calculate the new position of the object's mesh
	if(!lockX) tile.object.mesh.x = objectMeshCenterX - parallaxOffsetX;
	if(!lockY) tile.object.mesh.y = objectMeshCenterY - parallaxOffsetY;
}

function parallaxafyTileTexture(tile){
	const lockX = tile.getFlag(MODULE_ID, "lockX");
	const lockY = tile.getFlag(MODULE_ID, "lockY");
	const parallaxFactor = computeParallaxFactor(tile);
	const maxOffset = tile.getFlag(MODULE_ID, "maxDisplacement") ?? getDefaultMaxDisplacement();

	if(lockX && lockY || !parallaxFactor || !maxOffset) return;

	//convert texture space to world space?
	//tile.object.mesh.texture.orig.width
	//tile.width

	//should this use linear calculation instead? Include option to choose between hyperbolic tangent and linear?

	let objectMeshCenterX = tile.object.x + tile.object.mesh.width / 2;
	let objectMeshCenterY = tile.object.y + tile.object.mesh.height / 2;

	// Calculate the distance between the camera center and the object's mesh center
	let deltaX = canvas.stage.pivot.x - objectMeshCenterX;
	let deltaY = canvas.stage.pivot.y - objectMeshCenterY;

	// Apply the parallax effect
	let rawParallaxOffsetX = deltaX * parallaxFactor * 0.1;
	let rawParallaxOffsetY = deltaY * parallaxFactor * 0.1;

	// Constrain the parallax offset using a smooth approach with tanh
	let parallaxOffsetX = maxOffset * Math.tanh(rawParallaxOffsetX / maxOffset);
	let parallaxOffsetY = maxOffset * Math.tanh(rawParallaxOffsetY / maxOffset);

	// Calculate the new position of the object's mesh
	if(!lockX) tile.object.mesh.texture.orig.x = parallaxOffsetX;
	if(!lockY) tile.object.mesh.texture.orig.y = parallaxOffsetY;

	tile.object.mesh.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
	tile.object.mesh.texture.update()
}

function getParallaxTiles(){
	const parallaxTiles = [];
	for(const t of canvas.scene.tiles){
		if(t.getFlag(MODULE_ID, "enable")){
			parallaxTiles.push(t);
		}
	}
	return parallaxTiles;
}

function getDefaultMaxDisplacement(){
	return canvas.scene.grid.size;
}


// will make more efficnet in future, but just refresh the array of tiles
Hooks.on("deleteTile",() =>{
	if(!game.settings.get(MODULE_ID, "enableClient")) return;
	game.parallaxTiles.parallaxTileArray = getParallaxTiles();
});

Hooks.on("createTile",() =>{
	if(!game.settings.get(MODULE_ID, "enableClient")) return;
	game.parallaxTiles.parallaxTileArray = getParallaxTiles();
});

Hooks.on("drawTilesLayer",() =>{
	if(!game.settings.get(MODULE_ID, "enableClient")) return;
	game.parallaxTiles.parallaxTileArray = getParallaxTiles();
});

//clear the array on canvasTearDown
Hooks.on("canvasTearDown",() =>{
	if(!game.settings.get(MODULE_ID, "enableClient")) return;
	game.parallaxTiles.parallaxTileArray = [];
});


function registerModuleSettings() {

	game.settings.register(MODULE_ID, "enableClient", {
		name: "Enable on Client",
		hint: "Enables Parallax Tiles to render on this game client.",
		scope: "client",
		config: true,
		type: Boolean,

		default: true,
		onChange: () => canvas.draw(),
	});

	game.settings.register(MODULE_ID, "defaultParallaxFactor",{
		name: "Default Parallax Factor",
		hint: "Equation for determining the strength of the default parallax Factor. If parallax factor is left blank, this value will be used.",
		scope: "global",
		config: true,
		type: String,
		default: "1",
		onChange: () => canvas.draw(),
	})
}