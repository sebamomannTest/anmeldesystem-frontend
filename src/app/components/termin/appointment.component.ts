import {Component, NgModule, OnInit} from '@angular/core';
import {AppointmentService} from '../../services/appointment.service';
import {MatDialog, MatSnackBar} from '@angular/material';
import {FilterDialogComponent} from '../dialogs/filter/filterDialog.component';
import {isObject} from 'util';
import {CommentDialogComponent} from '../dialogs/comment/commentDialog.component';
import {IEnrollmentModel} from '../../models/IEnrollment.model';
import {IAppointmentModel} from '../../models/IAppointment.model';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpEventType} from '@angular/common/http';
import {animate, query, stagger, state, style, transition, trigger} from '@angular/animations';
import {AuthenticationService} from '../../services/authentication.service';
import {ConfirmationDialogComponent} from '../dialogs/confirmation-dialog/confirmation-dialog.component';
import {EnrollmentService} from '../../services/enrollment.service';

const HttpStatus = require('http-status-codes');

@Component({
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('in', style({opacity: 100})),
      transition('* => void', [
        animate(1000, style({opacity: 1})),
        animate(500, style({opacity: 0}))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query('mat-expansion-panel', [
          style({opacity: 0, transform: 'scale(0.9)'}),
          stagger(75, [
            animate('0.15s', style({opacity: 1, transform: 'scale(1.05)'})),
            animate('0.075s', style({opacity: 1, transform: 'scale(1)'})),
          ])
        ])
      ])
    ])
  ],
})
@NgModule({})
export class AppointmentComponent implements OnInit {

  public appointment: IAppointmentModel = null;
  // List to show (enrollments left after filter is applied)
  public enrollments: IEnrollmentModel[];
  public link: string;
  public filter: any;
  public allowModify = false;
  public percentDone;
  private disableAnimation = true;

  constructor(private appointmentService: AppointmentService, public dialog: MatDialog, private route: ActivatedRoute,
              private router: Router, private authenticationService: AuthenticationService, private enrollmentService: EnrollmentService,
              private snackBar: MatSnackBar) {
    this.route.queryParams.subscribe(params => {
      this.link = params.a;
    });

    this.route.params.subscribe(params => {
      if (params.link !== undefined) {
        this.link = params.link;
        this.router.navigate(['/enroll'], {queryParams: {a: this.link}}).then(() => '');
      }
    });
  }

  ngOnInit() {
    this.appointmentService.getAppointment(this.link).subscribe(sAppointment => {
        if (sAppointment.type === HttpEventType.DownloadProgress) {
          this.percentDone = Math.round(100 * sAppointment.loaded / sAppointment.total);
        } else if (sAppointment.type === HttpEventType.Response) {
          this.appointment = sAppointment.body;
          this.enrollments = sAppointment.body.enrollments;
          this.filter = this.initializeFilterObject(sAppointment.body);
          // this.allowModify = this.modificationAllowed();
          this.allowModify = true;
          setTimeout(() => this.disableAnimation = false);
        }
      },
      () => {
        this.appointment = undefined;
      });
  }

  /**
   * Remove enrollment from appointment list. Used for eliminating the need of re-fetching the entire appointment after enrollment deletion
   *
   * @param enrollment IEnrollmentModel Enrollment to delete from list
   */
  removeAppointment: (enrollment: IEnrollmentModel) => void
    = (enrollment: IEnrollmentModel) => {
    const index = this.appointment.enrollments.indexOf(enrollment);
    this.appointment.enrollments.splice(index, 1);
  };


  /**
   * Filter enrollment list for applying filters set by filterDialog.
   */
  filterEnrollments: () => IEnrollmentModel[] = () => {
    // Reset enrollment list to original list
    this.enrollments = this.appointment.enrollments;

    const numberOfAdditionFilters = this.filter.additions.filter(val => val.active).length;
    if (numberOfAdditionFilters > 0
      || this.filter.driverPassenger !== '') {
      const output: IEnrollmentModel[] = [];

      this.enrollments.forEach(eEnrollment => {
        try {
          if (numberOfAdditionFilters > 0) {
            let contains = 0;
            this.filter.additions.forEach(eFilterAddition => {
              let valid = true;

              if (eFilterAddition.active === true
                && eEnrollment.additions.some(iAddition => iAddition.id === eFilterAddition.id)) {
                contains++;
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
                return;
              }
            });

            if (contains === 0) {
              return;
            }
          }

          if (this.filter.driverPassenger !== ''
            && ((eEnrollment.driver === null
              && this.filter.driverPassenger === 'driver')
              || (eEnrollment.passenger === null
                && this.filter.driverPassenger === 'passenger'))) {
            return;
          }

          output.push(eEnrollment);
        } catch (e) {
          //
        }
      });
      return output;
    }
  };

  /**
   * Count number of active filter options. <br />
   * #selectedAdditions + (driverPassengerFilter ? 1 : 0) + (explicit ? 1 : 0)
   */
  getNumberOfActiveFilter: () => number = () => {
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
  };

  /**
   * Open dialog for setting filters for enrollment list. <br />
   * After closing, filter instantly applies and updates list of enrollments.
   *
   * @param error If error is true, then show error message, that no filter applies.
   */
  public _openFilterDialog = (error: boolean = false): void => {
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
          // Reopen filter if filter shows no results
          this._openFilterDialog(true);
          // Reset filter
          this.filter = oldFilter;
        } else {
          this.enrollments = tmpEnrollments;
        }
      }
    });
  };

  /**
   * Check for confirmation to delete the enrollment. <br />
   * On success/error show appropriate snackbar and delete enrollment from list so no re-fetch is needed
   *
   * @param enrollment Enrollment to delete
   */
  public _openConfirmationDialog = (enrollment: IEnrollmentModel): void => {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: `Bist du sicher, dass du "${enrollment.name}" löschen möchtest?`
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.enrollmentService
          .delete(enrollment)
          .subscribe(
            deletionResult => {
              if (deletionResult.type === HttpEventType.Response) {
                if (deletionResult.status === HttpStatus.OK) {
                  this.snackBar.open(`"${enrollment.name}" gelöscht`, null, {
                    duration: 2000,
                    panelClass: 'snackbar-default'
                  });
                  this.removeAppointment(enrollment);
                }
              }
            },
            error => {
              if (error.status === HttpStatus.FORBIDDEN) {
                this.snackBar.open(`Sorry, du hast keine Berechtigung diesen Teilnehmer zu löschen`, null, {
                  duration: 4000,
                  panelClass: 'snackbar-error'
                });
              }
            }
          );
      }
    });
  };

  /**
   * Open dialog in order to see comments of enrollment. <br />
   * Dialog also gives the opportunity to create a comment.
   *
   * @param enrollment Enrollment To get comment list from and sending comments to
   */
  public _openCommentDialog = (enrollment: IEnrollmentModel): void => {
    const dialogRef = this.dialog.open(CommentDialogComponent, {
      width: '90%',
      maxWidth: 'initial',
      height: 'auto',
      maxHeight: '80vh',
      data: {enrollment},
    });

    dialogRef.afterClosed().subscribe(() => {
    });
  };


  /**
   * Check for currentUser being allowed to modify current appointment </br>
   * This Also applies editing and deleting enrollments
   */
  modificationAllowed: () => (boolean) = () => {
    if (this.authenticationService.currentUserValue !== null) {
      if ((this.appointment.creator.username === this.authenticationService.currentUserValue.username)
        || (this.appointment.administrators.some(sAdministrator => {
          return sAdministrator.mail === this.authenticationService.currentUserValue.mail;
        }))) {
        return true;
      }

      if (EnrollmentUtil.getKey !== null) {
        return true;
      }
    } else {
      return false;
    }
  };

  /**
   * Check if id of addition is checked by enrollment.
   *
   * @param enrollment IEnrollmentModel Enrollment to search in
   * @param id string ID of addition to check for
   */
  private enrollmentCheckedAddition: (enrollment: IEnrollmentModel, id: string) => boolean
    = (enrollment: IEnrollmentModel, id: string): boolean => {
    return enrollment.additions.findIndex(add => add.id === id) !== -1;
  };

  /**
   * Create filter object with to appointment corresponding addition list.
   *
   * @param appointment IAppointmentModel of appointment to set filter for
   *
   * // TODO set return type
   */
  private initializeFilterObject: (appointment: IAppointmentModel) => any
    = (appointment: IAppointmentModel): any => {
    const additions = [];
    appointment.additions.forEach(value => additions.push({id: value.id, name: value.name, active: false}));
    return {additions, explicitly: 'dynamic', driverPassenger: ''};
  };
}
