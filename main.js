const MODULE_ID = "parallax-tiles";

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

	//create new tab
	html.querySelector(`.sheet-tabs`).insertAdjacentHTML("beforeend", `
	<a class="item" data-tab="parallax">
	<i class="fas fa-stars">
	</i> Parallax</a>
	`);

	const enableCheckbox = app.document.getFlag(MODULE_ID, "enable") ? "checked" : "";
	const maxDisplacement = app.document.getFlag(MODULE_ID, "maxDisplacement") ?? getDefaultMaxDisplacement(); //make this default to 1 grid of px
	const parallaxFactor = app.document.getFlag(MODULE_ID, "parallaxFactor") ?? 1;
	const lockX = app.document.getFlag(MODULE_ID, "enable") ? "checked" : "";
	const lockY = app.document.getFlag(MODULE_ID, "enable") ? "checked" : "";


	//create tab content
	html.querySelector(`.sheet-footer`).insertAdjacentHTML("beforebegin", `
	<div class="tab" data-tab="parallax">
		<p class="notes">Parallax-Tile Options Here.</p>
		<div class="form-group">
			<label>Enable Parallax Tile</label>
			<div class="form-fields">
				<input type="checkbox" name="flags.${MODULE_ID}.enable" ${enableCheckbox}>
			</div>
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
				<input type="number" step="any" name="flags.${MODULE_ID}.parallaxFactor" value="${parallaxFactor}">
			</div>
			<p class="hint">The strength of the parallax in respect to the relative positions canvas.</p>
		</div>

		<div class="form-group">
			<label>Lock Axis: <strong>X</strong></label>
			<div class="form-fields">
				<input type="checkbox" name="flags.${MODULE_ID}.lockX" value="${lockX}">
			</div>
		</div>	
		<div class="form-group">
			<label>Lock Axis: <strong>Y</strong></label>
			<div class="form-fields">
				<input type="checkbox" name="flags.${MODULE_ID}.lockY" value="${lockY}">
			</div>
		</div>	
	</div>    
	`);

});

Hooks.on("ready",() =>{
	game.parallaxTiles.parallaxTileArray = getParallaxTiles();
	parallaxafyTileArray();
});

//For the preveiw
Hooks.on("refreshTile",() => {
	parallaxafyTileArray();
});

//make the magic happen!
Hooks.on("canvasPan", (scene, screenPosistion) => {
	parallaxafyTileArray();
});

function parallaxafyTileArray(){
	for(const tile of game.parallaxTiles.parallaxTileArray){
		if(tile.getFlag(MODULE_ID, "enable")){
			parallaxafyTile(tile)
		}
	}
}

function parallaxafyTile(tile){
	const lockX = tile.getFlag(MODULE_ID, "lockX");
	const lockY = tile.getFlag(MODULE_ID, "lockY");
	const parallaxFactor = tile.getFlag(MODULE_ID, "parallaxFactor") ?? 1;
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
	game.parallaxTiles.parallaxTileArray = getParallaxTiles();
});

Hooks.on("createTile",() =>{
	game.parallaxTiles.parallaxTileArray = getParallaxTiles();
});