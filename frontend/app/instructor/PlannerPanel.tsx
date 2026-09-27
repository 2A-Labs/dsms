"use client";

import { useRef } from "react";
import { days, hours } from "./data";
import type { BookingRequest, RequestStatus } from "./types";

type PlannerProps = {
  bookable: Set<string>;
  requests: BookingRequest[];
  onToggle: (day: string, hour: string) => void;
  onBookWholeDay: (day: string) => void;
  onUpdateRequest: (id: number, status: RequestStatus) => void;
};

export function PlannerPanel({
  bookable,
  requests,
  onToggle,
  onBookWholeDay,
  onUpdateRequest,
}: PlannerProps) {
  const dragTarget = useRef<boolean | null>(null);
  const suppressClick = useRef(false);
  const setSlot = (day: string, hour: string, isOpen: boolean) => {
    if (bookable.has(`${day}-${hour}`) !== isOpen) onToggle(day, hour);
  };
  const startDrag = (day: string, hour: string) => {
    const isOpen = !bookable.has(`${day}-${hour}`);
    dragTarget.current = isOpen;
    suppressClick.current = true;
    setSlot(day, hour, isOpen);
  };
  const extendDrag = (day: string, hour: string) => {
    if (dragTarget.current !== null) setSlot(day, hour, dragTarget.current);
  };
  return (
    <>
      <div className="mb-8">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          Availability management
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Plan your week
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          Select one-hour blocks when students can request a lesson. Book or
          deny requests from the queue below.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_330px]">
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">
                Bookable hours
              </h2>
              <p className="mt-1 text-xs text-text-secondary">
                Click or drag across blocks to open or close them for requests.
              </p>
            </div>
            <div className="flex gap-3 text-[10px] font-bold text-text-secondary">
              <span>
                <i className="mr-1 inline-block size-2 rounded-full bg-primary" />
                Open
              </span>
              <span>
                <i className="mr-1 inline-block size-2 rounded-full bg-background ring-1 ring-border" />
                Closed
              </span>
              <span>
                <i className="mr-1 inline-block size-2 rounded-full bg-warning" />
                Requested
              </span>
              <span>
                <i className="mr-1 inline-block size-2 rounded-full bg-success" />
                Booked
              </span>
            </div>
          </div>
          <div
            className="overflow-x-auto"
            onPointerUp={() => {
              dragTarget.current = null;
            }}
            onPointerLeave={() => {
              dragTarget.current = null;
            }}
          >
            <div className="min-w-180">
              <div className="grid grid-cols-[64px_repeat(6,minmax(82px,1fr))] border-b border-border pb-3 text-center text-[10px] font-bold text-text-secondary">
                <span />
                {days.map((day) => (
                  <button
                    className="font-bold text-text-secondary transition hover:text-primary"
                    key={day}
                    type="button"
                    onClick={() => onBookWholeDay(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <div className="divide-y divide-border">
                {hours.map((hour) => (
                  <PlannerRow
                    key={hour}
                    hour={hour}
                    bookable={bookable}
                    requests={requests}
                    onToggle={onToggle}
                    onPointerDown={startDrag}
                    onPointerEnter={extendDrag}
                    suppressClick={suppressClick}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
        <RequestQueue requests={requests} onUpdateRequest={onUpdateRequest} />
      </div>
    </>
  );
}

function PlannerRow({
  hour,
  bookable,
  requests,
  onToggle,
  onPointerDown,
  onPointerEnter,
  suppressClick,
}: {
  hour: string;
  bookable: Set<string>;
  requests: BookingRequest[];
  onToggle: (day: string, hour: string) => void;
  onPointerDown: (day: string, hour: string) => void;
  onPointerEnter: (day: string, hour: string) => void;
  suppressClick: { current: boolean };
}) {
  return (
    <div className="grid grid-cols-[64px_repeat(6,minmax(82px,1fr))] items-center border-b border-border last:border-0">
      <time className="py-3 text-[11px] font-bold text-text-secondary">
        {hour}
      </time>
      {days.map((day) => (
        <PlannerCell
          key={day}
          day={day}
          hour={hour}
          isOpen={bookable.has(`${day}-${hour}`)}
          request={requests.find(
            (item) => item.day === day && item.time === hour,
          )}
          onToggle={onToggle}
          onPointerDown={onPointerDown}
          onPointerEnter={onPointerEnter}
          suppressClick={suppressClick}
        />
      ))}
    </div>
  );
}

function PlannerCell({
  day,
  hour,
  isOpen,
  request,
  onToggle,
  onPointerDown,
  onPointerEnter,
  suppressClick,
}: {
  day: string;
  hour: string;
  isOpen: boolean;
  request?: BookingRequest;
  onToggle: (day: string, hour: string) => void;
  onPointerDown: (day: string, hour: string) => void;
  onPointerEnter: (day: string, hour: string) => void;
  suppressClick: { current: boolean };
}) {
  const isRequested = request?.status === "Requested";
  const isBooked = request?.status === "Booked";
  const isLocked = isRequested || isBooked;

  return (
    <button
      className={`min-h-12 w-full border px-1 text-[10px] font-bold transition ${isBooked ? "cursor-not-allowed border-success bg-success/15 text-success" : isRequested ? "cursor-not-allowed border-warning bg-warning/15 text-warning" : isOpen ? "border-primary bg-primary-light text-primary hover:bg-primary hover:text-white" : "border-border bg-background text-text-secondary hover:border-primary"}`}
      type="button"
      disabled={isLocked}
      onPointerDown={(event) => {
        event.preventDefault();
        if (!isLocked) onPointerDown(day, hour);
      }}
      onPointerEnter={() => {
        if (!isLocked) onPointerEnter(day, hour);
      }}
      onClick={() => {
        if (isLocked) return;
        if (suppressClick.current) suppressClick.current = false;
        else onToggle(day, hour);
      }}
    >
      {isRequested
        ? "Requested"
        : isBooked
          ? "Booked"
          : isOpen
            ? "Bookable"
            : "Closed"}
      {isBooked && (
        <span className="mt-0.5 block truncate text-[9px] font-medium text-success">
          {request.student}
        </span>
      )}
    </button>
  );
}

function RequestQueue({
  requests,
  onUpdateRequest,
}: {
  requests: BookingRequest[];
  onUpdateRequest: (id: number, status: RequestStatus) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 sm:p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">
            Booking requests
          </h2>
          <p className="mt-1 text-xs text-text-secondary">
            Student requests for your open slots.
          </p>
        </div>
      </div>
      <div className="grid gap-4">
        {requests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            onUpdateRequest={onUpdateRequest}
          />
        ))}
      </div>
    </section>
  );
}

function RequestCard({
  request,
  onUpdateRequest,
}: {
  request: BookingRequest;
  onUpdateRequest: (id: number, status: RequestStatus) => void;
}) {
  return (
    <div className="border-b border-border pb-4 last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold">{request.student}</p>
          <p className="mt-1 text-[11px] text-text-secondary">
            {request.day} · {request.time}
          </p>
          <p className="mt-1 text-[11px] text-text-secondary">
            {request.detail}
          </p>
        </div>
        <span
          className={`text-[10px] font-bold ${request.status === "Requested" ? "text-warning" : request.status === "Booked" ? "text-success" : "text-error"}`}
        >
          {request.status}
        </span>
      </div>
      {request.status === "Requested" && (
        <div className="mt-3 flex gap-2">
          <button
            className="rounded-md bg-success px-3 py-2 text-[10px] font-bold text-white"
            type="button"
            onClick={() => onUpdateRequest(request.id, "Booked")}
          >
            Book
          </button>
          <button
            className="rounded-md border border-border px-3 py-2 text-[10px] font-bold text-error"
            type="button"
            onClick={() => onUpdateRequest(request.id, "Declined")}
          >
            Deny
          </button>
        </div>
      )}
    </div>
  );
}
