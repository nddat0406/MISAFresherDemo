using Core.DTO;
using Core.DTO.General;
using Core.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Interface.Service
{
    public interface IShiftService : IBaseService<ShiftDTO>
    {
        Task ChangeShiftStatus(List<Guid> ids, bool inactive);
    }
}
