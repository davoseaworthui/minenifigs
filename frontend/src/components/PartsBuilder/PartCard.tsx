"use client";

import React from "react";
import Image from "next/image";
import { useDraggable } from "@dnd-kit/core";
import { MinifigPart, Minifig } from "@/lib/rebrickable";

interface PartCardProps {
  part: MinifigPart;
  id: string;
  sourceMinifig?: Minifig;
}

const PartCard: React.FC<PartCardProps> = ({ part, id, sourceMinifig }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      data: {
        part,
        sourceMinifig: sourceMinifig || null,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-grab active:cursor-grabbing p-4 ${
        isDragging ? "opacity-50 z-50" : ""
      }`}
    >
      <div className="aspect-square relative bg-gray-100 rounded-md mb-3">
        {part.part.part_img_url ? (
          <Image
            src={part.part.part_img_url}
            alt={part.part.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="text-center">
        <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
          {part.part.name}
        </h4>

        <div className="flex items-center justify-between text-xs text-gray-600">
          <span
            className="px-2 py-1 rounded text-white text-xs font-medium"
            style={{ backgroundColor: `#${part.color.rgb}` }}
          >
            {part.color.name}
          </span>
          <span className="bg-gray-100 px-2 py-1 rounded">
            {part.quantity}x
          </span>
        </div>

        {sourceMinifig && (
          <div className="mt-2 text-xs text-blue-600 font-medium truncate">
            From: {sourceMinifig.name}
          </div>
        )}

        <div className="mt-2 text-xs text-gray-500">{part.part.part_num}</div>
      </div>
    </div>
  );
};

export default PartCard;
