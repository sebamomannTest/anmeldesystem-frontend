import {Component, NgModule, OnInit} from '@angular/core';
import {TerminService} from '../../services/termin.service';
import {MatDialog} from '@angular/material';
import {FilterDialogComponent} from '../dialogs/filter/filterDialog.component';
import {isObject} from 'util';
import {CommentDialogComponent} from '../dialogs/comment/commentDialog.component';
import {IEnrollmentModel} from '../../models/IEnrollment.model';
import {IAppointmentModel} from '../../models/IAppointment.model';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpEventType} from '@angular/common/http';

@Component({
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.scss']
})
@NgModule({})
export class AppointmentComponent implements OnInit {

  public link: string;
  public appointment: IAppointmentModel = null;
  public filter: any;
  public enrollments: IEnrollmentModel[];
  public allowModify = true;
  public percentDone;


  constructor(private terminService: TerminService, public dialog: MatDialog, private route: ActivatedRoute, private router: Router) {
    this.route.queryParams.subscribe(params => {
      this.link = params.val;
    });

    this.route.params.subscribe(params => {
      if (params.link !== undefined) {
        this.link = params.link;
        this.router.navigate(['/enroll'], {queryParams: {val: this.link}});
      }
    });
  }

  ngOnInit() {
    this.terminService.getAppointment(this.link).subscribe(sAppointment => {
        if (sAppointment.type === HttpEventType.DownloadProgress) {
          this.percentDone = Math.round(100 * sAppointment.loaded / sAppointment.total);
        } else if (sAppointment.type === HttpEventType.Response) {
          this.appointment = sAppointment.body;
          this.enrollments = sAppointment.body.enrollments;
          this.filter = this.initializeFilterObject(sAppointment.body);
        }
      },
      error => {
        this.appointment = undefined;
      });
  }

  openFilterDialog(error: boolean = false): void {
    const dialogRef = this.dialog.open(FilterDialogComponent, {
      width: '75%',
      height: 'auto',
      data: {
        appointment: this.appointment,
        filter: this.filter,
        error
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (isObject(result) && result !== this.filter) {
        const oldFilter = this.filter;
        const oldEnrollments = this.enrollments;

        this.filter = result;
        const tmpEnrollments = this.filterEnrollments();

        if (tmpEnrollments.length === 0 && this.getNumberOfActiveFilter() > 0) {
          this.enrollments = oldEnrollments;
          this.openFilterDialog(true);
          this.filter = oldFilter;
        } else {
          this.enrollments = tmpEnrollments;
        }
      }
    });

  }

  openCommentDialog(enrollment): void {
    const dialogRef = this.dialog.open(CommentDialogComponent, {
      width: '90%',
      maxWidth: 'initial',
      height: 'auto',
      maxHeight: '80vh',
      data: {enrollment},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(result);
    });
  }

  initializeFilterObject(appointment: IAppointmentModel): any {
    const additions = [];
    appointment.additions.forEach(value => additions.push({id: value.id, name: value.name, active: false}));
    return {additions, explicitly: 'dynamic', driverPassenger: ''};
  }

  filterEnrollments() {
    /* RESET */
    this.enrollments = this.appointment.enrollments;

    const BreakException = {};
    const numberOfAdditionFilters = this.filter.additions.filter(val => val.active).length;
    if (numberOfAdditionFilters > 0
      || this.filter.driverPassenger !== '') {
      const output = [];

      this.enrollments.forEach(eEnrollment => {
        try {
          if (numberOfAdditionFilters > 0) {
            let contains = 0;
            this.filter.additions.forEach(eFilterAddition => {
              let valid = true;

              if (eFilterAddition.active === true) {
                if (eEnrollment.additions.some(iAddition => iAddition.id === eFilterAddition.id)) {
                  contains++;
                }
              }

              eEnrollment.additions.forEach(eAddition => {
                if (eAddition.id === eFilterAddition.id
                  && !eFilterAddition.active
                  && this.filter.explicitly === 'explicit') {
                  valid = false;
                }
              });

              if ((this.filter.explicitly === 'explicit' || this.filter.explicitly === 'semiExplicit')
                && eFilterAddition.active === true
                && !eEnrollment.additions.some(sAddition => sAddition.id === eFilterAddition.id)) {
                valid = false;
              }

              if (!valid) {
                throw BreakException;
              }
            });

            if (contains === 0) {
              throw BreakException;
            }
          }

          if (this.filter.driverPassenger !== '') {
            if ((eEnrollment.driver === null && this.filter.driverPassenger === 'driver')
              || (eEnrollment.passenger === null && this.filter.driverPassenger === 'passenger')) {
              throw BreakException;
            }
          }

          output.push(eEnrollment);
        } catch (e) {
          //
        }
      });
      return output;
    }
  }

  getNumberOfActiveFilter() {
    let i = 0;
    this.filter.additions.forEach(filter => {
      if (filter.active) {
        i++;
      }
    });
    if (this.filter.driverPassenger === 'driver' || this.filter.driverPassenger === 'passenger') {
      i++;
    }
    return i;
  }

  findIndex(enrollment: IEnrollmentModel, id: string) {
    return enrollment.additions.findIndex(add => add.id === id);
  }
}
