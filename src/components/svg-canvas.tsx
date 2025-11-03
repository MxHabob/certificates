"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { Field } from "@/types/certificate";
import { mmToPx, pxToMm, snapMm } from "@/lib/utils";

interface Props {
	templateUrl: string;
	pageWidth_mm: number | null;
	pageHeight_mm: number | null;
	fields: Field[];
	selectedId: string | null;
	zoom: number;
	onSelect: (id: string | null) => void;
	onMove: (id: string, x: number, y: number) => void;
	gridStepMm?: number;
}

export function SvgCanvas({ templateUrl, pageWidth_mm, pageHeight_mm, fields, selectedId, zoom, onSelect, onMove, gridStepMm = 1 }: Props) {
	const svgRef = useRef<SVGSVGElement>(null);
	const [dragId, setDragId] = useState<string | null>(null);
	const startRef = useRef<{ x: number; y: number; fx: number; fy: number }>({ x: 0, y: 0, fx: 0, fy: 0 });

	const widthPx = pageWidth_mm ? mmToPx(pageWidth_mm) * zoom : 0;
	const heightPx = pageHeight_mm ? mmToPx(pageHeight_mm) * zoom : 0;

	const onMouseDownField = useCallback((e: React.MouseEvent, f: Field) => {
		e.stopPropagation();
		onSelect(f.id);
		setDragId(f.id);
		const rect = svgRef.current?.getBoundingClientRect();
		if (!rect) return;
		startRef.current = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
			fx: f.x,
			fy: f.y,
		};
	}, [onSelect]);

	useEffect(() => {
		if (!dragId) return;
		let raf: number | null = null;
		const move = (e: MouseEvent) => {
			const rect = svgRef.current?.getBoundingClientRect();
			if (!rect) return;
			const cx = e.clientX - rect.left;
			const cy = e.clientY - rect.top;
			const dxPx = cx - startRef.current.x;
			const dyPx = cy - startRef.current.y;
			if (raf) cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				let nx = startRef.current.fx + pxToMm(dxPx) / zoom;
				let ny = startRef.current.fy + pxToMm(dyPx) / zoom;
				if (gridStepMm > 0) {
					nx = snapMm(nx, gridStepMm);
					ny = snapMm(ny, gridStepMm);
				}
				onMove(dragId, Math.max(0, nx), Math.max(0, ny));
			});
		};
		const up = () => {
			if (raf) cancelAnimationFrame(raf);
			setDragId(null);
		};
		document.addEventListener("mousemove", move, { passive: true });
		document.addEventListener("mouseup", up);
		return () => {
			if (raf) cancelAnimationFrame(raf);
			document.removeEventListener("mousemove", move);
			document.removeEventListener("mouseup", up);
		};
	}, [dragId, gridStepMm, onMove, zoom]);

	const textAnchor = (a?: Field["align"]) => (a === "left" ? "start" : a === "right" ? "end" : "middle");

	return (
		<div className="relative" style={{ width: widthPx, height: heightPx }}>
    <svg
				ref={svgRef}
				width={widthPx}
				height={heightPx}
				className="block select-none bg-white"
				role="img"
      onMouseDown={(e) => { if (e.target === svgRef.current) onSelect(null); }}
			>
				{/* Background as cover-centered */}
				{templateUrl && (
        <image
						href={templateUrl}
						width={widthPx}
						height={heightPx}
						preserveAspectRatio="xMidYMid slice"
          style={{ pointerEvents: "none" }}
					/>
				)}
				{/* Fields */}
				{fields.filter(f => f.enabled !== false).map(f => {
					const x = mmToPx(f.x) * zoom;
					const y = mmToPx(f.y) * zoom;
					const sizePx = (f.fontSize / 72) * 96 * zoom; // approximate pt->px for preview only
					return (
						<g key={f.id} onMouseDown={e => onMouseDownField(e, f)} style={{ cursor: "move" }}>
							<text
								x={x}
								y={y}
								fontSize={sizePx}
								fill={f.color}
								textAnchor={textAnchor(f.align)}
								style={{ userSelect: "none", direction: "rtl" }}
								transform={f.rotation ? `rotate(${f.rotation}, ${x}, ${y})` : undefined}
							>
								{f.column ? f.label : (f.value || "نص")}
							</text>
							{selectedId === f.id && (
								<rect
									x={x - 6}
									y={y - sizePx}
									width={sizePx * 6}
									height={sizePx * 1.5}
									fill="none"
									stroke="var(--primary)"
									strokeDasharray="4 3"
								/>
							)}
						</g>
					);
				})}
        {/* Deselect handled on SVG root */}
			</svg>
		</div>
	);
}
