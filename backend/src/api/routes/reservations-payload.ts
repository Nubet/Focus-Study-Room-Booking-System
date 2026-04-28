export type CreateReservationBody = {
  id: string;
  roomId: string;
  userId: string;
  startTime: string;
  endTime: string;
};

export const isInvalidDate = (value: string): boolean =>
  Number.isNaN(new Date(value).getTime());

export const isCreateReservationBody = (
  body: Partial<CreateReservationBody>
): body is CreateReservationBody => {
  return (
    typeof body.id === "string" &&
    typeof body.roomId === "string" &&
    typeof body.userId === "string" &&
    typeof body.startTime === "string" &&
    typeof body.endTime === "string"
  );
};
