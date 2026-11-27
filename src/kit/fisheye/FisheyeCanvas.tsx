import React, { useEffect, useRef, useState } from 'react';
import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';
import {
  DEFAULT_FISHEYE_PARAMS,
  FisheyeRenderer,
  type FisheyeParams,
} from './FisheyeRenderer';

interface FisheyeCanvasProps extends Partial<FisheyeParams> {
  imageSrc: string;
  style?: React.CSSProperties;
}

export const FisheyeCanvas: React.FC<FisheyeCanvasProps> = ({
  imageSrc,
  strength = DEFAULT_FISHEYE_PARAMS.strength,
  zoom = DEFAULT_FISHEYE_PARAMS.zoom,
  focus = DEFAULT_FISHEYE_PARAMS.focus,
  moire = DEFAULT_FISHEYE_PARAMS.moire,
  vignette = DEFAULT_FISHEYE_PARAMS.vignette,
  rects = [],
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<FisheyeRenderer | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [handle] = useState(() => delayRender(`Loading fisheye image: ${imageSrc}`));

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImage(img);
    img.onerror = () => cancelRender(new Error(`Failed to load ${imageSrc}`));
    img.src = staticFile(imageSrc);
  }, [imageSrc]);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    if (!rendererRef.current) {
      rendererRef.current = new FisheyeRenderer(canvasRef.current);
    }
    rendererRef.current.setSource(image);
    continueRender(handle);
  }, [image, handle]);

  useEffect(() => () => rendererRef.current?.destroy(), []);

  useEffect(() => {
    if (!image || !rendererRef.current) return;
    rendererRef.current.setParams({
      strength,
      zoom,
      focus: { ...focus },
      moire: { ...moire },
      vignette: { ...vignette },
      rects,
    });
  }, [image, strength, zoom, focus, moire, vignette, rects]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        objectFit: 'cover',
        ...style,
      }}
    />
  );
};
