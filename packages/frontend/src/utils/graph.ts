import type { Commit } from '@forkweb/shared';
import { graphColors } from './branchColors';

const NULL_VERTEX_ID = -1;

/* Export Types for Vue Component */
export interface GraphVertex {
	sha: string;
	x: number;
	y: number;
	color: string;
}

export interface GraphBranch {
	path: string;
	color: string;
}

export interface GraphData {
	vertices: GraphVertex[];
	branches: GraphBranch[];
	width: number;
	height: number;
}

/* Internal Types */

interface Point {
	readonly x: number;
	readonly y: number;
}

interface Line {
	readonly p1: Point;
	readonly p2: Point;
	readonly lockedFirst: boolean;
}

interface UnavailablePoint {
	readonly connectsTo: VertexOrNull;
	readonly onBranch: Branch;
}

type VertexOrNull = Vertex | null;

/* Configuration */
interface GraphConfig {
	grid: {
		x: number;
		y: number;
		offsetX: number;
		offsetY: number;
	};
	colours: string[];
}

/* Branch Class */
class Branch {
	private readonly colour: number;
	private end: number = 0;
	private lines: Line[] = [];

	constructor(colour: number) {
		this.colour = colour;
	}

	public addLine(p1: Point, p2: Point, lockedFirst: boolean) {
		this.lines.push({ p1, p2, lockedFirst });
	}

	public getColour() {
		return this.colour;
	}

	public getEnd() {
		return this.end;
	}

	public setEnd(end: number) {
		this.end = end;
	}

	public draw(config: GraphConfig): string {
		const colour = config.colours[this.colour % config.colours.length];
		let path = '';
		const d = config.grid.y * 0.5; // Curve control point distance

		for (let i = 0; i < this.lines.length; i++) {
			const line = this.lines[i];
			const x1 = line.p1.x * config.grid.x + config.grid.offsetX;
			const y1 = line.p1.y * config.grid.y + config.grid.offsetY;
			const x2 = line.p2.x * config.grid.x + config.grid.offsetX;
			const y2 = line.p2.y * config.grid.y + config.grid.offsetY;

			// Start new path or continue from previous point
			if (path === '' || (i > 0 && (x1 !== this.lines[i-1].p2.x * config.grid.x + config.grid.offsetX || y1 !== this.lines[i-1].p2.y * config.grid.y + config.grid.offsetY))) {
				path += `M ${x1.toFixed(0)} ${y1.toFixed(1)} `;
			}

			if (x1 === x2) {
				// Vertical line
				path += `L ${x2.toFixed(0)} ${y2.toFixed(1)} `;
			} else {
				// Curved transition
				path += `C ${x1.toFixed(0)} ${(y1 + d).toFixed(1)}, ${x2.toFixed(0)} ${(y2 - d).toFixed(1)}, ${x2.toFixed(0)} ${y2.toFixed(1)} `;
			}
		}

		return path.trim();
	}
}

/* Vertex Class */
class Vertex {
	public readonly id: number;
	public readonly sha: string;

	private x: number = 0;
	private children: Vertex[] = [];
	private parents: Vertex[] = [];
	private nextParent: number = 0;
	private onBranch: Branch | null = null;
	private nextX: number = 0;
	private connections: UnavailablePoint[] = [];

	constructor(id: number, sha: string) {
		this.id = id;
		this.sha = sha;
	}

	/* Children */
	public addChild(vertex: Vertex) {
		this.children.push(vertex);
	}

	public getChildren(): ReadonlyArray<Vertex> {
		return this.children;
	}

	/* Parents */
	public addParent(vertex: Vertex) {
		this.parents.push(vertex);
	}

	public getParents(): ReadonlyArray<Vertex> {
		return this.parents;
	}

	public hasParents() {
		return this.parents.length > 0;
	}

	public getNextParent(): Vertex | null {
		if (this.nextParent < this.parents.length) return this.parents[this.nextParent];
		return null;
	}

	public registerParentProcessed() {
		this.nextParent++;
	}

	public isMerge() {
		return this.parents.length > 1;
	}

	/* Branch */
	public addToBranch(branch: Branch, x: number) {
		if (this.onBranch === null) {
			this.onBranch = branch;
			this.x = x;
		}
	}

	public isNotOnBranch() {
		return this.onBranch === null;
	}

	public isOnThisBranch(branch: Branch) {
		return this.onBranch === branch;
	}

	public getBranch() {
		return this.onBranch;
	}

	/* Point */
	public getPoint(): Point {
		return { x: this.x, y: this.id };
	}

	public getNextPoint(): Point {
		return { x: this.nextX, y: this.id };
	}

	public getPointConnectingTo(vertex: VertexOrNull, onBranch: Branch): Point | null {
		for (let i = 0; i < this.connections.length; i++) {
			if (this.connections[i].connectsTo === vertex && this.connections[i].onBranch === onBranch) {
				return { x: i, y: this.id };
			}
		}
		return null;
	}

	public registerUnavailablePoint(x: number, connectsToVertex: VertexOrNull, onBranch: Branch) {
		if (x === this.nextX) {
			this.nextX = x + 1;
			this.connections[x] = { connectsTo: connectsToVertex, onBranch: onBranch };
		}
	}

	/* Get Colour */
	public getColour() {
		return this.onBranch !== null ? this.onBranch.getColour() : 0;
	}
}

/* Main Graph Building Function */
export function buildCommitGraph(commits: Commit[], rowHeight: number): GraphData {
	if (commits.length === 0) {
		return { vertices: [], branches: [], width: 64, height: 0 };
	}

	const config: GraphConfig = {
		grid: {
			x: 16,
			y: rowHeight,
			offsetX: 8,
			offsetY: rowHeight / 2,
		},
		colours: graphColors,
	};

	const vertices: Vertex[] = [];
	const branches: Branch[] = [];
	const availableColours: number[] = [];
	const commitLookup: { [hash: string]: number } = {};
	const nullVertex = new Vertex(NULL_VERTEX_ID, '');

	// Step 1: Create vertices
	for (let i = 0; i < commits.length; i++) {
		commitLookup[commits[i].sha] = i;
		vertices.push(new Vertex(i, commits[i].sha));
	}

	// Step 2: Build parent-child relationships
	for (let i = 0; i < commits.length; i++) {
		const commit = commits[i];
		const parentShas = commit.parents || [];
		
		for (let j = 0; j < parentShas.length; j++) {
			const parentHash = parentShas[j];
			if (typeof commitLookup[parentHash] === 'number') {
				// Parent is in the graph
				vertices[i].addParent(vertices[commitLookup[parentHash]]);
				vertices[commitLookup[parentHash]].addChild(vertices[i]);
			} else {
				// Parent is not in the graph
				vertices[i].addParent(nullVertex);
			}
		}
	}

	// Step 3: Determine paths using the original algorithm
	const determinePath = (startAt: number) => {
		let i = startAt;
		let vertex = vertices[i];
		let parentVertex = vertices[i].getNextParent();
		let curVertex: Vertex;
		let lastPoint = vertex.isNotOnBranch() ? vertex.getNextPoint() : vertex.getPoint();
		let curPoint: Point | null;

		if (parentVertex !== null && parentVertex.id !== NULL_VERTEX_ID && vertex.isMerge() && !vertex.isNotOnBranch() && !parentVertex.isNotOnBranch()) {
			// Branch is a merge between two vertices already on branches
			let foundPointToParent = false;
			const parentBranch = parentVertex.getBranch()!;
			
			for (i = startAt + 1; i < vertices.length; i++) {
				curVertex = vertices[i];
				curPoint = curVertex.getPointConnectingTo(parentVertex, parentBranch);
				
				if (curPoint !== null) {
					foundPointToParent = true;
				} else {
					curPoint = curVertex.getNextPoint();
				}
				
				parentBranch.addLine(lastPoint, curPoint, !foundPointToParent && curVertex !== parentVertex ? lastPoint.x < curPoint.x : true);
				curVertex.registerUnavailablePoint(curPoint.x, parentVertex, parentBranch);
				lastPoint = curPoint;

				if (foundPointToParent) {
					vertex.registerParentProcessed();
					break;
				}
			}
		} else {
			// Branch is normal
			const getAvailableColour = (startAt: number): number => {
				for (let i = 0; i < availableColours.length; i++) {
					if (startAt > availableColours[i]) {
						return i;
					}
				}
				availableColours.push(0);
				return availableColours.length - 1;
			};

			const branch = new Branch(getAvailableColour(startAt));
			vertex.addToBranch(branch, lastPoint.x);
			vertex.registerUnavailablePoint(lastPoint.x, vertex, branch);
			
			for (i = startAt + 1; i < vertices.length; i++) {
				curVertex = vertices[i];
				const nextPoint = parentVertex === curVertex && !parentVertex.isNotOnBranch() ? curVertex.getPoint() : curVertex.getNextPoint();
				branch.addLine(lastPoint, nextPoint, lastPoint.x < nextPoint.x);
				curVertex.registerUnavailablePoint(nextPoint.x, parentVertex, branch);
				lastPoint = nextPoint;

				if (parentVertex === curVertex) {
					// The parent has been reached
					vertex.registerParentProcessed();
					const parentVertexOnBranch = !parentVertex.isNotOnBranch();
					parentVertex.addToBranch(branch, nextPoint.x);
					vertex = parentVertex;
					parentVertex = vertex.getNextParent();
					
					if (parentVertex === null || parentVertexOnBranch) {
						break;
					}
				}
			}
			
			if (i === vertices.length && parentVertex !== null && parentVertex.id === NULL_VERTEX_ID) {
				vertex.registerParentProcessed();
			}
			
			branch.setEnd(i);
			branches.push(branch);
			availableColours[branch.getColour()] = i;
		}
	};

	// Step 4: Process all vertices
	let i = 0;
	while (i < vertices.length) {
		if (vertices[i].getNextParent() !== null || vertices[i].isNotOnBranch()) {
			determinePath(i);
		} else {
			i++;
		}
	}

	// Step 5: Calculate max width
	let maxX = 0;
	for (let i = 0; i < vertices.length; i++) {
		const p = vertices[i].getNextPoint();
		if (p.x > maxX) maxX = p.x;
	}

	// Step 6: Convert to output format
	const graphVertices: GraphVertex[] = vertices
		.filter(v => !v.isNotOnBranch())
		.map(v => {
			const point = v.getPoint();
			return {
				sha: v.sha,
				x: point.x * config.grid.x + config.grid.offsetX,
				y: point.y * config.grid.y + config.grid.offsetY,
				color: config.colours[v.getColour() % config.colours.length],
			};
		});

	const graphBranches: GraphBranch[] = branches.map(b => ({
		path: b.draw(config),
		color: config.colours[b.getColour() % config.colours.length],
	}));

	const width = 2 * config.grid.offsetX + maxX * config.grid.x;
	const height = vertices.length * config.grid.y + config.grid.offsetY - config.grid.y / 2;

	return {
		vertices: graphVertices,
		branches: graphBranches,
		width,
		height,
	};
}
