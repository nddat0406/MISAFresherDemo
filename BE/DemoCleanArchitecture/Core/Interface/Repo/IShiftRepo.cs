using Core.Entity;
using Core.Enum;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Interface.Repo
{
    public interface IShiftRepo : IBaseRepo<Shift>
    {
        Task ChangeStatusAsync(List<Guid> ids, ShiftStatus changeToStatus);
        Task<Shift> GetByCode(string shiftCode);
    }
}
