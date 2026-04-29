export const splitRoomId = (roomId: string): { buildingCode: string; roomNumber: string } => {
  const [buildingCode = roomId, roomNumber = '---'] = roomId.split('-')
  return { buildingCode, roomNumber }
}
