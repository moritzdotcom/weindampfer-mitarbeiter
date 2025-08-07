import { TextField, Box } from '@mui/material';
import { useEffect } from 'react';

interface TimeRangePickerProps {
  date: string; // format: YYYY-MM-DD
  startTime: string; // format: HH:mm
  endTime: string; // format: HH:mm
  onChange: (
    startTime: string,
    endTime: string,
    startDateTime: Date,
    endDateTime: Date
  ) => void;
}

export default function TimeRangePicker({
  date,
  startTime,
  endTime,
  onChange,
}: TimeRangePickerProps) {
  const combineDateAndTime = (dateStr: string, timeStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute);
  };

  const getStartAndEnd = () => {
    const start = combineDateAndTime(date, startTime);
    let end = combineDateAndTime(date, endTime);
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }
    return { start, end };
  };

  useEffect(() => {
    const { start, end } = getStartAndEnd();
    onChange(startTime, endTime, start, end);
  }, [startTime, endTime]);

  return (
    <Box display="flex" gap={2}>
      <TextField
        label="Startzeit"
        type="time"
        fullWidth
        value={startTime}
        onChange={(e) =>
          onChange(
            e.target.value,
            endTime,
            getStartAndEnd().start,
            getStartAndEnd().end
          )
        }
        margin="normal"
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField
        label="Endzeit"
        type="time"
        fullWidth
        value={endTime}
        onChange={(e) =>
          onChange(
            startTime,
            e.target.value,
            getStartAndEnd().start,
            getStartAndEnd().end
          )
        }
        margin="normal"
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </Box>
  );
}
